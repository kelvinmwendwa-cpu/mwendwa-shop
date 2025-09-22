import { getCartCount } from './cart.js';

function updateYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

function updateBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = getCartCount();
}

document.addEventListener('DOMContentLoaded', () => {
  updateYear();
  updateBadge();
});