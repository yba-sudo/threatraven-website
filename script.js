// ThreatRaven website: theme toggle, reveal on scroll, top bar border, the film, the demo form,
// and the LinkedIn Insight Tag, which loads only after the visitor accepts it. No other tracking.
(function () {
  var root = document.documentElement

  // theme: the visitor's choice wins over the system setting and is remembered in this browser only
  var btn = document.getElementById('theme')
  function current() {
    var t = root.getAttribute('data-theme')
    if (t) return t
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  if (btn) btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('tr_theme', next) } catch (e) {}
  })

  // reveal on scroll
  var items = document.querySelectorAll('.reveal, .chain')
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' })
    items.forEach(function (el) { io.observe(el) })
  } else {
    items.forEach(function (el) { el.classList.add('in') })
  }

  // top bar gets its border once the page has moved
  var bar = document.querySelector('.topbar')
  function onScroll() { if (bar) bar.classList.toggle('scrolled', window.scrollY > 8) }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll()

  // the film plays, muted, only while it is on screen; with reduced motion it waits for a click
  var film = document.getElementById('film')
  if (film) {
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still) film.setAttribute('controls', '')
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = film.play(); if (p && p.catch) p.catch(function () { film.setAttribute('controls', '') }) }
          else film.pause()
        })
      }, { threshold: 0.4 }).observe(film)
    }
  }

  // "Watch it": land with the whole video on screen, centred below the top bar
  document.querySelectorAll('a[href="#watch"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var box = document.getElementById('watch'); if (!box) return
      ev.preventDefault()
      var top = bar ? bar.offsetHeight : 0, room = window.innerHeight - top, r = box.getBoundingClientRect()
      var y = window.scrollY + r.top - top - Math.max(12, (room - r.height) / 2)
      window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    })
  })

  // the demo form: sent in place; without JavaScript it posts to the form service directly
  var form = document.getElementById('demo-form'), note = document.getElementById('form-note')

  // field checks: they keep honest requests clean (the form service is the real gate against abuse)
  var FREE = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'ymail.com', 'outlook.com', 'hotmail.com',
    'hotmail.fr', 'live.com', 'live.fr', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com',
    'pm.me', 'gmx.com', 'gmx.de', 'gmx.net', 'web.de', 'yandex.com', 'yandex.ru', 'mail.ru', 'zoho.com', 'tutanota.com',
    'tuta.io', 'mail.com', 'qq.com', '163.com', 'laposte.net', 'orange.fr', 'free.fr', 'wanadoo.fr']
  var RULES = {
    name: [/^\p{L}[\p{L}\p{M} '’.-]*$/u, 'Please use letters only.'],
    company: [/^[\p{L}\p{N}][\p{L}\p{M}\p{N} &'’.,-]*$/u, 'Please use letters, numbers, spaces and & . , - only.'],
    role: [/^[\p{L}\p{M}\p{N} &'’.,/-]*$/u, 'Please use letters, numbers and spaces only.']
  }
  function check(el) {
    var v = el.value.trim(), msg = ''
    if (v && RULES[el.name] && !RULES[el.name][0].test(v)) msg = RULES[el.name][1]
    if (v && el.name === 'name' && (v.match(/\p{L}/gu) || []).length < 2) msg = 'Please enter your name.'
    if (v && el.name === 'email') {
      var m = /^[^\s@]+@([^\s@]+\.[a-z]{2,})$/i.exec(v)
      if (!m) msg = 'Please enter a valid email address.'
      else if (FREE.indexOf(m[1].toLowerCase()) !== -1) msg = 'Please use your work email.'
    }
    el.setCustomValidity(msg)
  }
  if (form) ['name', 'email', 'company', 'role'].forEach(function (k) {
    var el = form.elements[k]; if (!el) return
    el.addEventListener('input', function () { check(el) })
    el.addEventListener('blur', function () { check(el); if (el.value) el.reportValidity() })
    check(el)
  })

  if (form && window.fetch && window.FormData) form.addEventListener('submit', function (ev) {
    ev.preventDefault()
    if (form.botcheck && form.botcheck.checked) return
    ;['name', 'email', 'company', 'role'].forEach(function (k) { if (form.elements[k]) check(form.elements[k]) })
    if (!form.reportValidity()) return
    var send = form.querySelector('button[type=submit]')
    send.disabled = true; send.textContent = 'Sending…'
    note.className = 'note'; note.textContent = ''
    var data = {}; new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v })
    fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return r.ok && j.success }) })
      .then(function (ok) {
        if (!ok) throw new Error('not sent')
        form.querySelectorAll('input:not([type=hidden]):not(.trap), textarea').forEach(function (el) { el.value = '' })
        note.className = 'note ok'; note.textContent = 'Sent. Someone will be in touch with you soon.'
        // LinkedIn conversion "Demo request": only when the request was received, and only if the visitor accepted the tag
        if (window.lintrk) try { window.lintrk('track', { conversion_id: 32619737 }) } catch (e) {}
        send.textContent = 'Sent'
      })
      .catch(function () {
        note.className = 'note err'
        note.innerHTML = 'That did not go through. Please write to <a href="mailto:contact@threatraven.com">contact@threatraven.com</a>.'
        send.disabled = false; send.textContent = 'Request a demo'
      })
  })

  // cookies: the LinkedIn Insight Tag loads only after "Accept"; the choice is kept in this browser
  var PARTNER = '11277809', KEY = 'tr_consent'
  var box = document.getElementById('consent')
  function choice() { try { return localStorage.getItem(KEY) } catch (e) { return null } }
  function remember(v) { try { localStorage.setItem(KEY, v) } catch (e) {} }
  function loadInsight() {
    if (window._linkedin_partner_id) return
    window._linkedin_partner_id = PARTNER
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []
    window._linkedin_data_partner_ids.push(PARTNER)
    if (!window.lintrk) { window.lintrk = function (a, b) { window.lintrk.q.push([a, b]) }; window.lintrk.q = [] }
    var s = document.createElement('script'); s.async = true
    s.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'
    document.head.appendChild(s)
  }
  var c = choice()
  if (c === 'yes') loadInsight()
  if (box) {
    if (c !== 'yes' && c !== 'no') box.hidden = false
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-consent]'); if (!b) return
      var yes = b.getAttribute('data-consent') === 'yes'
      remember(yes ? 'yes' : 'no'); box.hidden = true
      if (yes) loadInsight()
    })
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function () {
        // withdrawing takes effect at once: the page reloads without the tag
        if (choice() === 'yes') { remember('no'); location.reload(); return }
        box.hidden = false
      })
    })
  }

  // FAQ: answers open and close with a short height and fade animation (instant with reduced motion)
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!calm && Element.prototype.animate) document.querySelectorAll('.faq details').forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('p'), run = null
    sum.addEventListener('click', function (ev) {
      ev.preventDefault()
      if (run) run.cancel()
      var closing = d.open, from = d.offsetHeight
      if (!closing) d.open = true
      var to = closing ? sum.offsetHeight : d.offsetHeight
      run = d.animate({ height: [from + 'px', to + 'px'] }, { duration: 280, easing: 'cubic-bezier(.2, .7, .2, 1)' })
      if (body) body.animate({ opacity: closing ? [1, 0] : [0, 1], transform: closing ? ['none', 'translateY(-4px)'] : ['translateY(-4px)', 'none'] }, { duration: closing ? 180 : 320, easing: 'ease', fill: 'none' })
      run.onfinish = function () { run = null; if (closing) d.open = false }
      run.oncancel = function () { run = null }
    })
  })

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear()
})()
