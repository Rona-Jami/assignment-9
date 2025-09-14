// script.js — module
// Implements: product list, add to cart, cart display, quantity adjust, remove, total using reduce,
// localStorage persistence, uses ES6 features (arrow functions, map, reduce, template literals).

const PRODUCTS = [
  { id: 1, name: "Minimal Leather Wallet", price: 29.99, image: "media/wallet.avif" },
  { id: 2, name: "Wireless Earbuds Pro",      price: 79.99, image: "media/wireless earbuds pro.jpg" },
  { id: 3, name: "Ceramic Coffee Mug",        price: 12.5,  image: "media/coffee mug.webp" },
  { id: 4, name: "Slim Notebook 120p",        price: 9.95,  image: "media/slim notebook.jpg" },
  { id: 5, name: "Desk Plant (Succulent)",   price: 14.0,  image: "media/plant.avif" },
  { id: 6, name: "Bluetooth Lamp",            price: 49.9,  image: "media/lamp.jpg" },
];

// localStorage key
const STORAGE_KEY = "shopping_cart_simulation_v1";

// DOM refs
const productsGrid = document.getElementById("productsGrid");
const cartContainer = document.getElementById("cartContainer");
const totalPriceEl = document.getElementById("totalPrice");
const totalItemsEl = document.getElementById("totalItems");
const searchInput = document.getElementById("searchInput");
const toastEl = document.getElementById("toast");
const clearCartBtn = document.getElementById("clearCartBtn");

// Cart represented as array of { id, name, price, qty, image }
let cart = [];

/* ---------- Persistence ---------- */
const saveCart = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
const loadCart = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  try{
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) cart = parsed;
  } catch(e){
    console.warn("Could not parse cart from localStorage:", e);
    cart = [];
  }
};

/* ---------- UI helpers ---------- */
const currency = num => `$${Number(num).toFixed(2)}`;

const showToast = (msg = "Added to cart") => {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastEl.classList.remove("show"), 1800);
};

/* ---------- Product rendering ---------- */
const productCardHTML = ({ id, name, price, image }) => `
  <article class="product-card" data-id="${id}">
    <img src="${image}" alt="${name}" loading="lazy" />
    <div class="product-meta">
      <h3>${name}</h3>
      <div class="price">${currency(price)}</div>
    </div>
    <p class="muted" style="color:var(--muted); font-size:.86rem">shop and enjoy the best products</p>
    <div class="product-actions">
      <button class="btn btn-primary add-btn" data-id="${id}">Add to Cart</button>
      <button class="btn btn-ghost" data-id="${id}" aria-label="Details">Details</button>
    </div>
  </article>
`;

/* Render products list (supports filter) */
const renderProducts = (items = PRODUCTS) => {
  productsGrid.innerHTML = items.map(productCardHTML).join("");
  // bind add buttons
  document.querySelectorAll(".add-btn").forEach(btn => btn.addEventListener("click", () => {
    const id = Number(btn.dataset.id);
    handleAddToCart(id);
  }));
};

/* ---------- Cart operations ---------- */
const findProduct = id => PRODUCTS.find(p => p.id === id);

const handleAddToCart = id => {
  const product = findProduct(id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, image: product.image });
  }
  saveCart();
  renderCart();
  showToast(`${product.name} added to cart`);
};

const handleQtyChange = (id, delta) => {
  cart = cart.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item)
             .filter(item => item.qty > 0);
  saveCart();
  renderCart();
};

const handleRemoveItem = id => {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  renderCart();
};

const handleClearCart = () => {
  cart = [];
  saveCart();
  renderCart();
};

/* ---------- Cart UI ---------- */
const cartItemHTML = ({ id, name, price, qty, image }) => `
  <div class="cart-item" data-id="${id}">
    <img src="${image}" alt="${name}" />
    <div class="info">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="name">${name}</div>
        <div class="price small">${currency(price)}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px">
        <div class="qty-controls">
          <button class="qty-btn decrease" data-id="${id}">−</button>
          <span style="min-width:32px;text-align:center;font-weight:700">${qty}</span>
          <button class="qty-btn increase" data-id="${id}">+</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="muted small">Subtotal: <strong>${currency(price * qty)}</strong></div>
          <button class="btn btn-ghost remove-btn" data-id="${id}">Remove</button>
        </div>
      </div>
    </div>
  </div>
`;

/* Calculate totals using reduce() */
const calculateTotals = () => {
  const totals = cart.reduce((acc, item) => {
    acc.items += item.qty;
    acc.price += item.qty * item.price;
    return acc;
  }, { items: 0, price: 0 });
  return totals;
};

const renderCart = () => {
  if (cart.length === 0) {
    cartContainer.innerHTML = `<div style="color:var(--muted);padding:12px;border-radius:8px;background:#fbfbfb">Your cart is empty.</div>`;
    totalPriceEl.textContent = currency(0);
    totalItemsEl.textContent = "0";
    return;
  }
  cartContainer.innerHTML = cart.map(cartItemHTML).join("");
  // attach control handlers
  cartContainer.querySelectorAll(".increase").forEach(btn => btn.addEventListener("click", () => handleQtyChange(Number(btn.dataset.id), +1)));
  cartContainer.querySelectorAll(".decrease").forEach(btn => btn.addEventListener("click", () => handleQtyChange(Number(btn.dataset.id), -1)));
  cartContainer.querySelectorAll(".remove-btn").forEach(btn => btn.addEventListener("click", () => handleRemoveItem(Number(btn.dataset.id))));

  const { items, price } = calculateTotals();
  totalItemsEl.textContent = items;
  totalPriceEl.textContent = currency(price);
};

/* ---------- Search / filter ---------- */
const doSearch = (term = "") => {
  const t = term.trim().toLowerCase();
  if (!t) return renderProducts(PRODUCTS);
  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(t));
  renderProducts(filtered);
};

/* ---------- Init ---------- */
const init = () => {
  loadCart();
  renderProducts();
  renderCart();

  searchInput.addEventListener("input", e => doSearch(e.target.value));
  clearCartBtn.addEventListener("click", () => {
    if (!confirm("Clear entire cart?")) return;
    handleClearCart();
  });
};

// Run
init();

// Expose for debugging in console if needed
window.__SHOP = { PRODUCTS, getCart: () => cart, saveCart, loadCart };
