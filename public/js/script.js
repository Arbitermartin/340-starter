// // TOGGLE BUTTON
// document.getElementById('toggleButton').addEventListener('click',function(){
//   let navMenu = document.getElementById('navMenu');
//   if (navMenu.classList.contains('show')) {
//       this.innerHTML = '<i class="bi bi-list"></i>';
//   } else {
//       this.innerHTML = '<i class="bi bi-x"></i>';
//   }
//   navMenu.classList.toggle('show');
// });

//   // Password toggle functionality
//   const togglePassword = document.getElementById('togglePassword');
//   const passwordInput = document.getElementById('account_password');
//   togglePassword.addEventListener('click', function() {
//       const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
//       passwordInput.setAttribute('type', type);
//       this.textContent = type === 'password' ? 'Show Password' : 'Hide Password';
//   });

//   AOS.init({
//     duration: 800,
//     easing: 'ease-in-out',
//     once: true
//   });


//     // Pure JavaScript for mobile sidebar toggle
//     const menuToggle = document.getElementById('menuToggle');
//     const sidebar = document.getElementById('sidebar');
//     const overlay = document.getElementById('overlay');

//     menuToggle.addEventListener('click', () => {
//       sidebar.classList.toggle('active');
//       overlay.classList.toggle('active');
//     });

//     overlay.addEventListener('click', () => {
//       sidebar.classList.remove('active');
//       overlay.classList.remove('active');
//     });
// async function viewMember(memberId) {
//   try {
//     const response = await fetch(`/account/inventory/members/${memberId}`);
//     if (!response.ok) throw new Error('Failed to load member');

//     const member = await response.json();

//     const content = `
//       <div class="member-01">
//         ${member.member_profile_image ? `
//           <img src="${member.member_profile_image}" alt="Profile" 
//               class="member-profile">
//         ` : '<p>No profile image</p>'}
//       </div>
//       <p><strong>ID:</strong> ${member.member_id}</p>
//       <p><strong>Full Name:</strong> ${member.member_firstname} ${member.member_lastname}</p>
//       <p><strong>Email:</strong> ${member.member_email}</p>
//       <p><strong>Phone:</strong> ${member.member_phone || 'N/A'}</p>
//       <p><strong>Address:</strong> ${member.member_address || 'N/A'}</p>
//       <p><strong>Membership Number:</strong> ${member.membership_number || 'N/A'}</p>
//       <p><strong>Joined:</strong> ${new Date(member.created_at).toLocaleString('en-GB')}</p>
//     `;

//     document.getElementById('memberDetailContent').innerHTML = content;
//     document.getElementById('viewMemberModal').classList.add('active');
//   } catch (err) {
//     console.error(err);
//     alert('Error loading member details');
//   }
// }

// // --- DELETE MEMBER ---
// let currentDeleteId = null;

// function confirmDeleteMember(memberId) {
//   currentDeleteId = memberId;
//   document.getElementById('deleteConfirmModal').classList.add('active');
// }

// // Confirm deletion
// document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
//   if (!currentDeleteId) return;

//   try {
//     const response = await fetch(`/account/inventory/members/${currentDeleteId}`, {
//       method: 'DELETE',
//       headers: { 'Content-Type': 'application/json' }
//     });

//     if (response.ok) {
//       // Remove member row from table
//       const row = document.querySelector(`tr[data-member-id="${currentDeleteId}"]`);
//       if (row) row.remove();

//       alert('Member deleted successfully');
//     } else {
//       const errData = await response.json();
//       alert(errData.message || 'Failed to delete member');
//     }
//   } catch (err) {
//     console.error(err);
//     alert('Error during deletion');
//   }

//   closeModal('deleteConfirmModal');
//   currentDeleteId = null;
// });

// // --- CLOSE MODAL ---
// function closeModal(modalId) {
//   document.getElementById(modalId)?.classList.remove('active');
// }

// // Close modal if clicking outside content
// document.querySelectorAll('.modal-overlay').forEach(modal => {
//   modal.addEventListener('click', e => {
//     if (e.target === modal) closeModal(modal.id);
//   });
// });


// // Employee Dashboard JS (if needed for interactivity)
// // e.g., feedback emojis click
// const emojis = document.querySelectorAll('.emojis i');
// emojis.forEach(emoji => {
//   emoji.addEventListener('click', () => {
//     alert('Feedback submitted!');
//   });
// });

// // year display in footer
// document.getElementById("year").textContent = new Date().getFullYear();
document.addEventListener("DOMContentLoaded", () => {

  // --- TOGGLE NAV MENU ---
  const toggleButton = document.getElementById('toggleButton');
  const navMenu = document.getElementById('navMenu');

  if (toggleButton && navMenu) {
    toggleButton.addEventListener('click', function () {
      if (navMenu.classList.contains('show')) {
        this.innerHTML = '<i class="bi bi-list"></i>';
      } else {
        this.innerHTML = '<i class="bi bi-x"></i>';
      }
      navMenu.classList.toggle('show');
    });
  }

  // --- PASSWORD TOGGLE ---
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('account_password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      this.textContent = type === 'password' ? 'Show Password' : 'Hide Password';
    });
  }

  // --- AOS INIT ---
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });
  }

  // --- MOBILE SIDEBAR ---
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // --- DELETE MEMBER CONFIRM BUTTON ---
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeleteId) return;

      try {
        const response = await fetch(`/account/inventory/members/${currentDeleteId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const row = document.querySelector(`tr[data-member-id="${currentDeleteId}"]`);
          if (row) row.remove();
          alert('Member deleted successfully');
        } else {
          const errData = await response.json();
          alert(errData.message || 'Failed to delete member');
        }
      } catch (err) {
        console.error(err);
        alert('Error during deletion');
      }

      closeModal('deleteConfirmModal');
      currentDeleteId = null;
    });
  }

  // --- CLOSE MODAL ON OUTSIDE CLICK ---
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // --- EMOJI FEEDBACK ---
  const emojis = document.querySelectorAll('.emojis i');
  if (emojis.length > 0) {
    emojis.forEach(emoji => {
      emoji.addEventListener('click', () => {
        alert('Feedback submitted!');
      });
    });
  }

  // --- FOOTER YEAR ---
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

});


// --- VIEW MEMBER ---
async function viewMember(memberId) {
  try {
    const response = await fetch(`/account/inventory/members/${memberId}`);
    if (!response.ok) throw new Error('Failed to load member');

    const member = await response.json();

    const content = `
      <div class="member-01">
        ${member.member_profile_image ? `
          <img src="${member.member_profile_image}" alt="Profile" class="member-profile">
        ` : '<p>No profile image</p>'}
      </div>
      <p><strong>ID:</strong> ${member.member_id}</p>
      <p><strong>Full Name:</strong> ${member.member_firstname} ${member.member_lastname}</p>
      <p><strong>Email:</strong> ${member.member_email}</p>
      <p><strong>Phone:</strong> ${member.member_phone || 'N/A'}</p>
      <p><strong>Address:</strong> ${member.member_address || 'N/A'}</p>
      <p><strong>Membership Number:</strong> ${member.membership_number || 'N/A'}</p>
      <p><strong>Joined:</strong> ${new Date(member.created_at).toLocaleString('en-GB')}</p>
    `;

    const container = document.getElementById('memberDetailContent');
    const modal = document.getElementById('viewMemberModal');

    if (container && modal) {
      container.innerHTML = content;
      modal.classList.add('active');
    }

  } catch (err) {
    console.error(err);
    alert('Error loading member details');
  }
}


// --- DELETE MEMBER ---
let currentDeleteId = null;

function confirmDeleteMember(memberId) {
  currentDeleteId = memberId;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.add('active');
}


// --- CLOSE MODAL FUNCTION ---
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}