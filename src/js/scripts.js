document.addEventListener('DOMContentLoaded', function () {
  // sidenav
  const sideNav = document.querySelector('.sidenav')
  M.Sidenav.init(sideNav, {})

  // modal cards
  const modals = document.querySelectorAll('.modal')
  M.Modal.init(modals, {})
})

