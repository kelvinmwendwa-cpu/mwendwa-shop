// cart.js

export function getCartItems() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

export function updateCartBadge() {
  const cart = getCartItems();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = totalQty;
}

export function getCartTotal() {
  const cart = getCartItems();
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function addToCart(product) {
  const isRegistered = localStorage.getItem('isRegistered') === 'true';
  if (!isRegistered) {
    alert('Please register before adding items to your cart.');
    window.location.href = 'register.html';
    return;
  }

  const cart = getCartItems();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += product.qty;
  } else {
    cart.push(product);
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

export function changeQty(productId, delta) {
  const cart = getCartItems();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      const index = cart.indexOf(item);
      cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
  }
}

export function removeFromCart(productId) {
  const cart = getCartItems().filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}