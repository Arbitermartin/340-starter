// TOGGLE BUTTON
document.getElementById('toggleButton').addEventListener('click',function(){
  let navMenu = document.getElementById('navMenu');
  if (navMenu.classList.contains('show')) {
      this.innerHTML = '<i class="bi bi-list"></i>';
  } else {
      this.innerHTML = '<i class="bi bi-x"></i>';
  }
  navMenu.classList.toggle('show');
});

  // Password toggle functionality
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('account_password');
  togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? 'Show Password' : 'Hide Password';
  });

  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });
