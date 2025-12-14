// utilities/index.js
const utilities =require("../utilities")
// This file generates the FULL navigation bar HTML that matches your design

const getNav = async function () {
  // Determine active page (for highlighting the correct link)
  // We'll pass the current path from the controller later
  // For now, we just return the full HTML

  return `
<nav class="nav_bar" aria-label="Main navigation">
  <div class="logo">
    <a href="/" aria-label="UHWF Home">
      <img src="/images/site/uhwf-logo.webp" alt="UHWF Logo" loading="lazy" width="60" height="60">
    </a>
    <div class="content">
      <h3><a href="/" class="logo-text">UHWF</a></h3>
    </div>
  </div>

  <button class="navbar-toggler" id="toggleButton" aria-label="Toggle navigation menu" aria-expanded="false">
    <i class="bi bi-list"></i>
  </button>

  <ul class="nav_links" id="navMenu">
    <li><a href="/" class="nav-link">Home</a></li>
    <li><a href="/about" class="nav-link">About Us</a></li>
    
    <li class="dropdown">
      <a href="javascript:void(0)" class="dropbtn nav-link">
        Services 
        <i class="fas fa-angle-down arrow"></i>
      </a>
      <div class="dropdown-content">
        <a href="/services/research">Research & Publications</a>
        <a href="/services/datasets">Datasets & Tools</a>
        <a href="/services/training">Training & Workshops</a>
        <a href="/services/consultancy">Consultancy</a>
        <a href="/services/membership">Membership</a>
      </div>
    </li>

    <li><a href="/forum" class="nav-link">Community Forum</a></li>
    <li><a href="/events" class="nav-link">Events</a></li>
    <li><a href="/team" class="nav-link">Our Team</a></li>
    <li><a href="/contact" class="nav-link">Contact Us</a></li>
  </ul>
</nav>

<!-- Mobile-friendly JavaScript for toggle (you can move this to a separate file later) -->
<script>
  document.getElementById('toggleButton')?.addEventListener('click', function () {
    const menu = document.getElementById('navMenu');
    const expanded = this.getAttribute('aria-expanded') === 'true';
    menu.classList.toggle('active');
    this.setAttribute('aria-expanded', !expanded);
    this.querySelector('i').classList.toggle('bi-list');
    this.querySelector('i').classList.toggle('bi-x');
  });
</script>
  `.trim()
}

// Optional: Add active class based on current path (super useful!)
const getNavWithActive = async function (currentPath = '/') {
  let nav = await getNav()

  // Replace the first occurrence of href="{currentPath}" with class="active"
  const regex = new RegExp(`href="${currentPath}"`, 'g')
  nav = nav.replace(regex, `href="${currentPath}" class="active"`)

  // Special case for home
  if (currentPath === '/' || currentPath === '/Home') {
    nav = nav.replace('href="/" class="nav-link"', 'href="/" class="nav-link active"')
  }

  return nav
}

// Quick stats for homepage (still no DB needed)
const getPortalStats = async function () {
  return {
    totalMembers: 924,
    researchPapers: 156,
    activeProjects: 18,
    upcomingEvents: 7
  }
}

// Add this function — fixes the crash immediately
function handleErrors(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res.render("errors/error", {
        title: "Server Error",
        message: "Something went wrong!",
        error: process.env.NODE_ENV === 'development' ? error : {}
      });
    }
  };
}
module.exports = {
  getNav,
  getNavWithActive,
  getPortalStats,
  handleErrors,
};