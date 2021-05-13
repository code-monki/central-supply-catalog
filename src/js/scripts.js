const disclaimerToggle = document.getElementById('disclaimer-toggle');

// toggle the disclaimer pane
if (disclaimerToggle !== null) {
  disclaimerToggle.addEventListener('click', (e) => {
    let disclaimerContent = document.querySelector('.disclaimer-content');

    // show or hide the content pane
    if (disclaimerContent !== null) {
      disclaimerContent.style.display = disclaimerContent.style.display === 'none' ? 'block' : 'none';
    }

    // change the chevron to point up if closed, down if open
    let icon = document.getElementById('disclaimer-toggle-icon');
    if (icon !== null) {
      icon.className = disclaimerContent.style.display === 'none' ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
  });
}
