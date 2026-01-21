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


    // Pure JavaScript for mobile sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
    



    
// // View Member Details (AJAX)
// async function viewMember(memberId) {
//   try {
//     const response = await fetch(`/account/inventory/member/${memberId}`);
//     if (!response.ok) throw new Error('Failed to load member');

//     const member = await response.json();

//     const content = `
//       <div style="text-align:center; margin-bottom:1.5rem;">
//         ${member.member_profile_image ? `
//           <img src="${member.member_profile_image}" alt="Profile" 
//                style="width:140px; height:140px; border-radius:50%; object-fit:cover; border:4px solid #e8f5e9;">
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
//     alert('Error loading member details');
//   }
// }

// // Delete Confirmation
// let currentDeleteId = null;

// function confirmDeleteMember(memberId) {
//   currentDeleteId = memberId;
//   document.getElementById('deleteConfirmModal').classList.add('active');
// }

// // Confirm Yes - Delete via AJAX
// document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
//   if (!currentDeleteId) return;

//   try {
//     const response = await fetch(`/inventory/members/${currentDeleteId}`, {
//       method: 'DELETE',
//       headers: { 'Content-Type': 'application/json' }
//     });

//     if (response.ok) {
//       alert('Member deleted successfully');
//       location.reload(); // Refresh table
//     } else {
//       alert('Failed to delete member');
//     }
//   } catch (err) {
//     alert('Error during deletion');
//   }

//   closeModal('deleteConfirmModal');
// });

// // Close modal helper
// function closeModal(modalId) {
//   document.getElementById(modalId).classList.remove('active');
// }

// // Close modals when clicking outside
// document.querySelectorAll('.modal-overlay').forEach(modal => {
//   modal.addEventListener('click', e => {
//     if (e.target === modal) closeModal(modal.id);
//   });
// });
// --- VIEW MEMBER DETAILS (AJAX) ---
async function viewMember(memberId) {
  try {
    const response = await fetch(`/account/inventory/members/${memberId}`);
    if (!response.ok) throw new Error('Failed to load member');

    const member = await response.json();

    const content = `
      <div class="member-01">
        ${member.member_profile_image ? `
          <img src="${member.member_profile_image}" alt="Profile" 
              class="member-profile">
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

    document.getElementById('memberDetailContent').innerHTML = content;
    document.getElementById('viewMemberModal').classList.add('active');
  } catch (err) {
    console.error(err);
    alert('Error loading member details');
  }
}

// --- DELETE MEMBER ---
let currentDeleteId = null;

function confirmDeleteMember(memberId) {
  currentDeleteId = memberId;
  document.getElementById('deleteConfirmModal').classList.add('active');
}

// Confirm deletion
document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
  if (!currentDeleteId) return;

  try {
    const response = await fetch(`/account/inventory/members/${currentDeleteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // Remove member row from table
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

// --- CLOSE MODAL ---
function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove('active');
}

// Close modal if clicking outside content
document.querySelectorAll('.modal-overlay').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal.id);
  });
});


// Employee Dashboard JS (if needed for interactivity)
// e.g., feedback emojis click
const emojis = document.querySelectorAll('.emojis i');
emojis.forEach(emoji => {
  emoji.addEventListener('click', () => {
    alert('Feedback submitted!');
  });
});