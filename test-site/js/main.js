/**
 * NovaStore & DarkGuard AI Test Bed Client Script
 * Pure vanilla JavaScript - 100% offline and dependency-free.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCart();
  initAddons();
  initThumbnails();
  initTabs();
  initTestSuiteBar();
  initShamingActions();
});

// Shopping Cart state
let cartCount = 0;

function initCart() {
  const addBtn = document.querySelector('.add-to-cart');
  const cartBadge = document.querySelector('.cart-count');

  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cartCount++;
      if (cartBadge) {
        cartBadge.textContent = cartCount;
      }
      showToast('Item added to your shopping bag!');
    });
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

// Addon checkbox toggle visual sync
function initAddons() {
  const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
  addonCheckboxes.forEach((cb) => {
    const card = cb.closest('.addon-card');
    if (card) {
      if (cb.checked) {
        card.classList.add('selected');
      }
      cb.addEventListener('change', () => {
        if (cb.checked) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }
  });
}

// Thumbnail gallery switching
function initThumbnails() {
  const thumbs = document.querySelectorAll('.thumb-item');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });
}

// Product info tabs
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => (p.style.display = 'none'));

      btn.classList.add('active');
      const activePane = document.getElementById(target);
      if (activePane) {
        activePane.style.display = 'block';
      }
    });
  });
}

// Shaming offer interaction
function initShamingActions() {
  const declineBtn = document.querySelector('.decline-btn');
  const acceptBtn = document.querySelector('.btn-accept-offer');
  const shamingBox = document.querySelector('.shaming-container');

  if (declineBtn && shamingBox) {
    declineBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Offer declined.');
    });
  }

  if (acceptBtn && shamingBox) {
    acceptBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Special offer applied to your order!');
    });
  }
}

// Quick navigation switcher for Hackathon Judges
function initTestSuiteBar() {
  // Can be extended for quick jump dropdown if needed
}
