document.addEventListener('DOMContentLoaded', function () {
  const menuItems = document.querySelectorAll('.nav-menu li');
  const pages = document.querySelectorAll('.page');

  menuItems.forEach(item => {
    item.addEventListener('click', function () {
      // Remove active from all menu items and pages
      menuItems.forEach(m => m.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));

      // Get target page based on data attribute
      const targetPage = this.getAttribute('data-page');

      // Add active to current menu item
      this.classList.add('active');

      // Show corresponding page
      document.getElementById(`${targetPage}-page`).classList.add('active');
    });
  });

  // Set default active page to Map
  document.querySelector('li[data-page="map"]').classList.add('active');
});

// Toggle Sidebar
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');

  sidebar.classList.toggle('open');
  // Toggle the page-container margin-left using body class
  document.body.classList.toggle('sidebar-open');
}

document.querySelector('.hamburger').addEventListener('click', toggleSidebar);
