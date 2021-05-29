const disclaimerToggle = document.getElementById('disclaimer-toggle')
const disclaimer = document.querySelector('.disclaimer')
const disclaimerContent = document.querySelector('.disclaimer-content')

// toggle the disclaimer pane
if (disclaimerToggle !== null) {
  disclaimerToggle.addEventListener('click', (e) => {
    // let disclaimerContent = document.querySelector('.disclaimer-content')

    // show or hide the content pane
    if (disclaimerContent !== null) {
      let displayType = 'block'
      disclaimerContent.style.display = disclaimerContent.style.display === 'none' ? displayType : 'none'
    }

    // change the chevron to point up if closed, down if open
    let icon = document.getElementById('disclaimer-toggle-icon')
    if (icon !== null) {
      icon.className = disclaimerContent.style.display === 'none' ? 'fas fa-chevron-up' : 'fas fa-chevron-down'
    }
  })
}

// event handler to detect click outside of disclaimer
disclaimer.addEventListener('blur', () => {
  // hide the disclaimer content
  disclaimerContent.style.display = 'none'
}, true)

