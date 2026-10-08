// ThreatRaven website: theme toggle, reveal on scroll, top bar border. No tracking, no dependencies.
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

  var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear()
})()
