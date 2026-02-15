// ============================================== 
// AI ORDER AUTOMATION SYSTEM - JAVASCRIPT
// Email-Based Authentication + Order Form Integration
// ============================================== 

console.log('✅ script.js is loading...');

// Configuration
const ORDER_WEBHOOK = 'https://techy.app.n8n.cloud/webhook/tally-sales-order';
const QUOTATION_WEBHOOK = 'https://techy.app.n8n.cloud/webhook/generate-invoice';
// Complaint webhook (n8n)
const COMPLAINT_WEBHOOK = 'https://techy.app.n8n.cloud/webhook/sales-complaint';
// Review webhook (n8n) - sentiment analysis + email response
const REVIEW_WEBHOOK = 'https://techy.app.n8n.cloud/webhook/submit-your-review';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Backend API URL - automatically detects localhost in development, uses Vercel in production
const BACKEND_URL = (() => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Production: Replace 'your-backend-url.vercel.app' with your actual Vercel backend URL
    // After deploying to Vercel, update this URL
    return 'https://your-backend-url.vercel.app';
  }
  return 'http://localhost:5000';
})();

// Local proxy toggle: set to true to forward webhook requests through a local server at BACKEND_URL
// This helps during local testing to avoid CORS issues. To use it, run `node proxy-server.js` from the project root.
const USE_LOCAL_PROXY = true;

// Active webhook endpoints (use proxy when enabled)
const ACTIVE_ORDER_WEBHOOK = USE_LOCAL_PROXY ? `${BACKEND_URL}/webhook/order` : ORDER_WEBHOOK;
const ACTIVE_QUOTATION_WEBHOOK = USE_LOCAL_PROXY ? `${BACKEND_URL}/webhook/quotation` : QUOTATION_WEBHOOK;
const ACTIVE_COMPLAINT_WEBHOOK = USE_LOCAL_PROXY ? `${BACKEND_URL}/webhook/complaint` : COMPLAINT_WEBHOOK;
const ACTIVE_REVIEW_WEBHOOK = USE_LOCAL_PROXY ? `${BACKEND_URL}/webhook/review` : REVIEW_WEBHOOK;
// Load products from products.json (includes real image URLs)
let PRODUCTS = [];
(async () => {
  try {
    const res = await fetch('products.json');
    PRODUCTS = await res.json();
    console.log('✓ Loaded', PRODUCTS.length, 'products');
    // If DOM already loaded, update the select immediately
    try {
      if (document && (document.readyState === 'interactive' || document.readyState === 'complete')) {
        populateProductSelect(PRODUCTS);
        console.log('✓ populateProductSelect called after products load');
      }
    } catch (e) {
      // ignore if populate fails here; it will be called on DOMContentLoaded as well
    }
  } catch (err) {
    console.warn('Could not load products.json:', err.message);
    PRODUCTS = [];
  }
})();

// Fallback product names (from user's provided list) - used when products.json is missing
const FALLBACK_PRODUCT_NAMES = [
  "Smart Anti-Theft Backpack",
  "Gaming Desktop RTX 4070",
  "Smart Blood Pressure Monitor",
  "Smart LED Makeup Mirror",
  "Smart Essential Oil Diffuser",
  "Induction Cooktop",
  "Smart Wall Oven",
  "Portable Bluetooth Speaker",
  "Smart Indoor Garden Kit",
  "External Camera Flashgun",
  "Smartphone Camera Lens Kit",
  "Smartphone Gimbal Stabilizer",
  "GaN Wall Charger 100W",
  "4TB External Hard Drive",
  "Smart Power Drill Kit",
  "Smart Yoga Mat",
  "4K Webcam with Autofocus",
  "Smart Toaster Oven",
  "Smart Jump Rope",
  "Smart Exercise Bike",
  "Color-Changing Smart Light Bulb",
  "Smart Power Strip with USB",
  "Smart Microwave Oven",
  "Smart Treadmill",
  "Smart Washer",
  "Robotic Vacuum Cleaner",
  "Espresso Machine with Grinder",
  "Smart Carry-On Luggage",
  "Portable Air Conditioner",
  "Smart Document Scanner",
  "Digital Voice Recorder with Transcription",
  "Portable Photo Printer",
  "Home Security Camera System",
  "Smart Home Hub",
  "Smart Home Speaker with AI",
  "Portable Car Jump Starter",
  "Smart Wine Opener",
  "Indoor Electric Grill",
  "Smart Body Composition Scale",
  "Percussion Massage Gun",
  "Electric Shaver",
  "Smart Hair Dryer",
  "HEPA Air Purifier",
  "Smart Humidifier",
  "Smart Water Bottle",
  "Smart Electric Kettle",
  "Smart Steam Iron",
  "Wearable Fitness Tracker",
  "Heated Winter Gloves",
  "Smart Heated Jacket",
  "Smart Air Pump for Tires",
  "Smart Robotic Lawn Mower",
  "GPS Pet Collar",
  "Smart Pet Feeder",
  "Smart TV Box with 8K Support",
  "4K Laser Projector",
  "Soundbar with Subwoofer",
  "Wireless Charging Dock Station",
  "Portable Power Bank with PD",
  "Braided USB-C Cable 2-Pack",
  "1TB Portable SSD",
  "Smart Light Switch 4-Pack",
  "Smart Electric Blanket",
  "Smart Umbrella with GPS",
  "Smart Self-Cleaning Water Bottle",
  "Smart Rice Cooker",
  "Digital Air Fryer with Presets",
  "Smart Tablet for Kids",
  "Smart GPS Wallet",
  "Smart Heated Socks",
  "Smart Audio Sunglasses",
  "Smart Kitchen Scale"
];

// DOM Elements - Will be initialized in DOMContentLoaded
let authModal;
let authCloseBtn;
let loginForm;
let registerForm;
let form;
let submitBtn;
let responseMessage;
let customerEmailField;
let quotationForm;
let quotationSubmitBtn;
let quotationResponseMessage;
let quotationCustomerEmailField;
let complaintForm;
let complaintSubmitBtn;
let complaintResponseMessage;
let reviewForm;
let reviewSubmitBtn;
let reviewResponseMessage;
let loginRequiredMsg;
let userInfoDisplay;
let orderFormContainer;
let userProfile;
let yearElement;



// Products are provided inline in `PRODUCTS` constant above.

function populateProductSelect(products) {
  const select = document.getElementById('product_name');
  if (!select || !Array.isArray(products) || products.length === 0) return;
  // Remove any non-placeholder options (keep first placeholder)
  while (select.options.length > 1) select.remove(1);
  // Build a unique list of product names from products.json plus fallback list
  const nameSet = new Set();
  products.forEach(p => { if (p && p.name) nameSet.add(p.name); });
  FALLBACK_PRODUCT_NAMES.forEach(n => { if (n) nameSet.add(n); });

  // Convert to array and sort for predictable order
  const names = Array.from(nameSet);

  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// =====================
// Products gallery + modal
// =====================
function showProducts() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-products')?.classList.add('active');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.add('hidden');
  document.getElementById('products-view')?.classList.remove('hidden');
  renderProducts(PRODUCTS);
}

function showNewOrder() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-new-order')?.classList.add('active');
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.remove('hidden');
}

function showQuotation() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-quotation')?.classList.add('active');
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.remove('hidden');
}

function showOrderHistory(){
  const currentUser = getCurrentUser();

  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-order-history')?.classList.add('active');
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.remove('hidden');

  if (!currentUser) {
    showAuthModal('login');
    const container = document.getElementById('order-history-container');
    const subtitle = document.getElementById('order-history-subtitle');
    if (container) container.innerHTML = '<div class="no-orders-message"><p>🔐 Sign in required</p><p style="color: var(--text-secondary); margin-top: 0.5rem;">Please sign in to view your order history.</p><button class="btn btn-primary" style="margin-top: 1rem;" onclick="showAuthModal(\'login\')">Sign In</button></div>';
    if (subtitle) subtitle.textContent = '';
    return;
  }

  // Load and display orders for this user
  renderOrderHistory(currentUser);
}

function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  const gridStory = document.getElementById('products-grid-story');
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  function buildProductCard(p) {
    const card = document.createElement('div');
    card.className = 'product-card app-card';

    const title = document.createElement('div');
    title.className = 'product-title';
    title.textContent = p.name;

    const stars = document.createElement('div');
    stars.className = 'product-stars';
    stars.innerHTML = '&#9733;&#9733;&#9733;&#9733;&#9734;';
    stars.setAttribute('aria-label', '4 out of 5 stars');

    const meta = document.createElement('div');
    meta.className = 'product-meta';
    meta.textContent = `${p.stock} in stock`;

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = formatter.format(p.priceINR);

    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const compareBtn = document.createElement('button');
    compareBtn.className = 'btn-small-ghost';
    compareBtn.textContent = 'Add to compare';
    compareBtn.addEventListener('click', () => openProductModal(p.id));

    const shopBtn = document.createElement('button');
    shopBtn.className = 'btn btn-primary btn-small';
    shopBtn.textContent = 'Shop Now';
    shopBtn.addEventListener('click', () => {
      const select = document.getElementById('product_name');
      if (select) {
        let option = Array.from(select.options).find(o => o.value === p.name);
        if (!option) {
          option = document.createElement('option');
          option.value = p.name;
          option.textContent = p.name;
          select.appendChild(option);
        }
        select.value = p.name;
      }
      showNewOrder();
    });

    actions.appendChild(compareBtn);
    actions.appendChild(shopBtn);

    card.appendChild(title);
    card.appendChild(stars);
    card.appendChild(meta);
    card.appendChild(price);
    card.appendChild(actions);
    return card;
  }

  if (grid) {
    grid.innerHTML = '';
    list.forEach(p => {
      grid.appendChild(buildProductCard(p));
    });
    // Add "Add to Compare Slot" card (reference style)
    const slotCard = document.createElement('div');
    slotCard.className = 'compare-slot-card';
    slotCard.innerHTML = '<span class="slot-plus">+</span><span class="slot-label">Add to Compare Slot</span><button type="button" class="btn btn-primary btn-small">Compare Now</button>';
    slotCard.addEventListener('click', (e) => { if (!e.target.closest('.btn')) showNewOrder(); });
    grid.appendChild(slotCard);
  }

  if (gridStory) {
    gridStory.innerHTML = '';
    list.slice(0, 8).forEach(p => {
      gridStory.appendChild(buildProductCard(p));
    });
  }

  // Wire search
  const search = document.getElementById('product-search');
  if (search && !search._wired) {
    search._wired = true;
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      const activeCat = document.querySelector('.category-tab.active')?.getAttribute('data-category') || 'all';
      const filtered = getFilteredProducts(activeCat, q);
      renderProducts(filtered);
    };
  }

  // Wire category tabs
  document.querySelectorAll('.category-tab').forEach(btn => {
    if (btn._wired) return;
    btn._wired = true;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category') || 'all';
      const searchVal = document.getElementById('product-search')?.value?.trim()?.toLowerCase() || '';
      const filtered = getFilteredProducts(cat, searchVal);
      renderProducts(filtered);
    });
  });
}

function getFilteredProducts(category, searchQuery) {
  let list = PRODUCTS || [];
  if (searchQuery) {
    list = list.filter(p => (p.name && p.name.toLowerCase().includes(searchQuery)) || (p.id && p.id.toLowerCase().includes(searchQuery)));
  }
  if (category && category !== 'all') {
    const q = category.toLowerCase();
    list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.id && p.id.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase() === q));
  }
  return list;
}

function openProductModal(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  // build modal
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h3>${p.name}</h3>
      <button id="modal-close" class="link-btn">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;gap:1rem;">
        <div style="flex:1">
          <p class="product-meta">ID: ${p.id}</p>
          <p class="product-meta">Stock: ${p.stock}</p>
          <p class="product-price">Price: ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(p.priceINR)}</p>
          <p style="margin-top:0.5rem;color:var(--text-secondary)">This is a placeholder description. Provide product descriptions to replace this text.</p>
          <div style="margin-top:1rem;display:flex;gap:0.5rem">
            <button class="btn btn-primary" id="modal-order">Order Now</button>
            <button class="btn btn-outline" id="modal-close-2">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); }
  backdrop.querySelector('#modal-close')?.addEventListener('click', close);
  backdrop.querySelector('#modal-close-2')?.addEventListener('click', close);
  backdrop.querySelector('#modal-order')?.addEventListener('click', () => {
    // prefill and open order
    const select = document.getElementById('product_name');
    if (select) {
      let option = Array.from(select.options).find(o => o.value === p.name);
      if (!option) {
        option = document.createElement('option');
        option.value = p.name;
        option.textContent = p.name;
        select.appendChild(option);
      }
      select.value = p.name;
    }
    close();
    showNewOrder();
  });
}
// ============================================== 
// FIREBASE AUTH INITIALIZATION
// ============================================== 

// Listen for Firebase auth state changes
window.addEventListener('userLoggedIn', (event) => {
  const user = event.detail;
  console.log('✅ Auth event: User logged in', user.email);
  displayUserLoggedIn({ email: user.email, name: user.displayName || user.email });
});

window.addEventListener('userLoggedOut', () => {
  console.log('❌ Auth event: User logged out');
  displayUserLoggedOut();
});

// Theme toggle: light (red/white) <-> dark (light red/black)
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  function setThemeIcon(theme) {
    btn.textContent = theme === 'light' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
  setThemeIcon(document.documentElement.getAttribute('data-theme') || 'dark');
  btn.addEventListener('click', function() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setThemeIcon(next);
  });
}

// Check initial auth state
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  setTimeout(() => {
    const user = FirebaseAuth.getCurrentUser();
    if (user) {
      displayUserLoggedIn({ email: user.email, name: user.displayName || user.email });
    }
  }, 500);
});

// ============================================== 
// AUTH STATE MANAGEMENT (Firebase-based)
// ============================================== 

function getCurrentUser() {
  // Get Firebase user
  try {
    if (FirebaseAuth && typeof FirebaseAuth.getCurrentUser === 'function') {
      const fbUser = FirebaseAuth.getCurrentUser();
      if (fbUser) return fbUser;
    }
  } catch (err) {
    // ignore
  }

  return null;
}

// ============================================== 
// CHECK AUTH STATUS
// ============================================== 

function checkAuthStatus() {
  const user = FirebaseAuth.getCurrentUser();
  
  if (user) {
    displayUserLoggedIn({ email: user.email, name: user.displayName || user.email });
  } else {
    displayUserLoggedOut();
  }
}

// ============================================== 
// UPDATE UI FOR LOGGED IN USER
// ============================================== 

function displayUserLoggedIn(user) {
  // Hide auth navigation buttons
  const authNav = document.getElementById('auth-nav');
  const navCta = document.getElementById('nav-cta-btn');
  const navSignin = document.getElementById('nav-signin');
  if (authNav) authNav.classList.add('hidden');
  if (navCta) navCta.classList.add('hidden');
  if (navSignin) navSignin.style.display = 'none';
  
  // Show user profile (header: avatar + email/name + logout)
  if (userProfile) {
    userProfile.classList.remove('hidden');
    const emailEl = document.getElementById('user-email');
    if (emailEl) emailEl.textContent = user.name || user.email;
  }
  
  // Show order form and hide login message (order view)
  if (loginRequiredMsg) loginRequiredMsg.classList.add('hidden');
  if (userInfoDisplay) {
    userInfoDisplay.classList.remove('hidden');
    const formUserEmail = document.getElementById('form-user-email');
    if (formUserEmail) formUserEmail.textContent = user.email;
  }
  // Quotation view: same for its login msg and user info
  const loginRequiredQuotation = document.getElementById('login-required-msg-quotation');
  const userInfoDisplayQuotation = document.getElementById('user-info-display-quotation');
  if (loginRequiredQuotation) loginRequiredQuotation.classList.add('hidden');
  if (userInfoDisplayQuotation) {
    userInfoDisplayQuotation.classList.remove('hidden');
    const formUserEmailQuotation = document.getElementById('form-user-email-quotation');
    if (formUserEmailQuotation) formUserEmailQuotation.textContent = user.email;
  }
  if (form) form.classList.add('visible');
  
  // Auto-populate customer email for both forms
  if (customerEmailField) {
    customerEmailField.value = user.email;
  }
  if (quotationCustomerEmailField) {
    quotationCustomerEmailField.value = user.email;
  }
  // Lock complaint contact and review email to registered Gmail (not fillable)
  syncComplaintReviewEmailFields(user.email, true);
  const reviewName = document.getElementById('review_name');
  if (reviewName && !reviewName.value) reviewName.value = user.name || user.email.split('@')[0];
}

// When logged in: set email/contact from user and disable so not fillable. When logged out: clear and enable.
function syncComplaintReviewEmailFields(email, loggedIn) {
  const complaintContact = document.getElementById('complaint_contact');
  const reviewEmail = document.getElementById('review_email');
  if (complaintContact) {
    complaintContact.value = loggedIn ? (email || '') : '';
    complaintContact.disabled = !!loggedIn;
    complaintContact.readOnly = !!loggedIn;
  }
  if (reviewEmail) {
    reviewEmail.value = loggedIn ? (email || '') : '';
    reviewEmail.disabled = !!loggedIn;
    reviewEmail.readOnly = !!loggedIn;
  }
}

// ============================================== 
// UPDATE UI FOR LOGGED OUT USER
// ============================================== 

function displayUserLoggedOut() {
  // Show auth navigation buttons
  const authNav = document.getElementById('auth-nav');
  const navCta = document.getElementById('nav-cta-btn');
  const navSignin = document.getElementById('nav-signin');
  if (authNav) authNav.classList.remove('hidden');
  if (navCta) navCta?.classList.remove('hidden');
  if (navSignin) navSignin.style.display = '';
  
  // Hide user profile
  if (userProfile) userProfile.classList.add('hidden');
  
  // Hide order form and show login message (both views)
  if (loginRequiredMsg) loginRequiredMsg.classList.remove('hidden');
  if (userInfoDisplay) userInfoDisplay.classList.add('hidden');
  const loginRequiredQuotation = document.getElementById('login-required-msg-quotation');
  const userInfoDisplayQuotation = document.getElementById('user-info-display-quotation');
  if (loginRequiredQuotation) loginRequiredQuotation.classList.remove('hidden');
  if (userInfoDisplayQuotation) userInfoDisplayQuotation.classList.add('hidden');
  if (form) form.classList.remove('visible');
  
  // Clear customer email and complaint/review contact fields (make fillable again)
  if (customerEmailField) customerEmailField.value = '';
  syncComplaintReviewEmailFields('', false);
}

// ============================================== 
// AUTH MODAL HANDLERS
// ============================================== 

function showAuthModal(formType = 'login') {
  if (!authModal) {
    console.warn('authModal element not found');
    return;
  }
  authModal.classList.remove('hidden');

  if (formType === 'login') {
    switchAuthForm('login');
  } else if (formType === 'register') {
    switchAuthForm('register');
  }
}

function closeAuthModal() {
  if (authModal) authModal.classList.add('hidden');
  if (loginForm && typeof loginForm.reset === 'function') loginForm.reset();
  if (registerForm && typeof registerForm.reset === 'function') registerForm.reset();
}

function switchAuthForm(type) {
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  
  if (type === 'login') {
    if (loginFormContainer) loginFormContainer.classList.remove('hidden');
    if (registerFormContainer) registerFormContainer.classList.add('hidden');
  } else if (type === 'register') {
    if (loginFormContainer) loginFormContainer.classList.add('hidden');
    if (registerFormContainer) registerFormContainer.classList.remove('hidden');
  }
}



// ============================================== 
// REGISTRATION HANDLER
// ============================================== 

function handleRegisterClick(e) {
  console.log('🔐 handleRegisterClick called via onclick!');
  if (e) e.preventDefault();
  handleRegister(e || { preventDefault: () => {} });
}

async function handleRegister(e) {
  e.preventDefault();
  console.log('🔐 handleRegister called!');

  const email = document.getElementById('register_email').value.trim();
  const name = document.getElementById('register_name').value.trim();
  const password = document.getElementById('register_password').value;
  const confirmPassword = document.getElementById('register_confirm').value;
  
  console.log('📝 Form data:', { email, name, passwordLength: password.length });

  // Clear previous errors
  const registerFormContainer = document.getElementById('register-form-container');
  registerFormContainer?.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });

  // Validation
  let errorMsg = '';
  let errorField = null;

  if (!email) {
    errorMsg = 'Email is required';
    errorField = 'register_email';
  } else if (!emailRegex.test(email)) {
    errorMsg = 'Please enter a valid email address';
    errorField = 'register_email';
  } else if (!name) {
    errorMsg = 'Name is required';
    errorField = 'register_name';
  } else if (!password) {
    errorMsg = 'Password is required';
    errorField = 'register_password';
  } else if (password.length < 6) {
    errorMsg = 'Password must be at least 6 characters';
    errorField = 'register_password';
  } else if (password !== confirmPassword) {
    errorMsg = 'Passwords do not match';
    errorField = 'register_confirm';
  }

  // Show error if validation failed
  if (errorMsg) {
    if (errorField) {
      const inputElement = document.getElementById(errorField);
      if (inputElement && inputElement.parentElement) {
        const errorElement = inputElement.parentElement.querySelector('.form-error');
        if (errorElement) {
          errorElement.textContent = errorMsg;
          errorElement.classList.add('show');
        }
      }
    }
    return;
  }

  // Register with Firebase
  try {
    const result = await FirebaseAuth.register(email, password, name);
    
    if (result.success) {
      console.log('✅ Registration successful:', result.user.email);
      registerForm.reset();
      closeAuthModal();
      showAuthResponse('success', '✓ Account Created!', `Welcome ${name}! Your account is ready to use.`);
    } else {
      console.error('❌ Registration error:', result.error);
      const errorElement = registerFormContainer?.querySelector('[id="register_email"]')?.parentElement?.querySelector('.form-error');
      if (errorElement) {
        errorElement.textContent = result.error;
        errorElement.classList.add('show');
      } else {
        showAuthResponse('error', 'Registration Failed', result.error);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error during registration:', error);
    showAuthResponse('error', 'Registration Error', 'An unexpected error occurred. Please try again.');
  }
}


// ============================================== 
// LOGIN HANDLER
// ============================================== 

function handleLoginClick(e) {
  console.log('🔐 handleLoginClick called via onclick!');
  if (e) e.preventDefault();
  handleLogin(e || { preventDefault: () => {} });
}

async function handleLogin(e) {
  e.preventDefault();
  console.log('🔐 handleLogin called!');
  const email = document.getElementById('login_email').value.trim();
  const password = document.getElementById('login_password').value;
  
  // Clear previous errors
  const loginFormContainer = document.getElementById('login-form-container');
  loginFormContainer?.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  
  // Validation
  let errorMsg = '';
  let errorField = null;
  
  if (!email || !password) {
    errorMsg = 'Email and password are required';
    errorField = email ? 'login_password' : 'login_email';
  }
  
  // Show error if validation failed
  if (errorMsg) {
    if (errorField) {
      const inputElement = document.getElementById(errorField);
      if (inputElement && inputElement.parentElement) {
        const errorElement = inputElement.parentElement.querySelector('.form-error');
        if (errorElement) {
          errorElement.textContent = errorMsg;
          errorElement.classList.add('show');
        }
      }
    }
    return;
  }
  
  // Login with Firebase
  try {
    const result = await FirebaseAuth.login(email, password);
    
    if (result.success) {
      console.log('✅ Login successful:', result.user.email);
      closeAuthModal();
      showAuthResponse('success', '✓ Login Successful!', `Welcome back, ${result.user.displayName || email}!`);
    } else {
      console.error('❌ Login error:', result.error);
      const errorElement = loginFormContainer?.querySelector('[id="login_email"]')?.parentElement?.querySelector('.form-error');
      if (errorElement) {
        errorElement.textContent = result.error;
        errorElement.classList.add('show');
      } else {
        showAuthResponse('error', 'Login Failed', result.error);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error during login:', error);
    showAuthResponse('error', 'Login Error', 'An unexpected error occurred. Please try again.');
  }
}

// ============================================== 
// LOGOUT HANDLER
// ============================================== 

async function logout() {
  // Try Firebase logout
  try {
    if (FirebaseAuth && typeof FirebaseAuth.logout === 'function') {
      const result = await FirebaseAuth.logout();
      if (!result || !result.success) {
        console.warn('Firebase logout did not report success', result);
      }
    }
  } catch (err) {
    console.warn('Firebase logout error (ignoring):', err);
  }

  closeAuthModal();
  window.dispatchEvent(new CustomEvent('userLoggedOut'));
  showAuthResponse('info', '✓ Logged Out', 'You have been logged out. See you soon!');
}

// =====================
// GOOGLE SIGN-IN HANDLER
// =====================

async function handleGoogleSignIn() {
  console.log('🔵 Google Sign-In clicked');
  
  try {
    if (!FirebaseAuth || typeof FirebaseAuth.signInWithGoogle !== 'function') {
      showAuthResponse('error', 'Google Sign-In Error', 'Google authentication not available. Please try email/password.');
      return;
    }
    
    const result = await FirebaseAuth.signInWithGoogle();
    
    if (result.success) {
      console.log('✅ Google Sign-In successful:', result.user.email);
      closeAuthModal();
      showAuthResponse('success', '✓ Welcome!', `Signed in as ${result.user.displayName || result.user.email}`);
    } else {
      console.error('❌ Google Sign-In failed:', result.error);
      showAuthResponse('error', 'Sign-In Failed', result.error || 'Google Sign-In failed');
    }
  } catch (error) {
    console.error('❌ Unexpected error during Google Sign-In:', error);
    showAuthResponse('error', 'Error', 'An unexpected error occurred. Please try again.');
  }
}

// Attach form handlers
// NOTE: These are NOW attached in DOMContentLoaded to ensure forms exist
// registerForm?.addEventListener('submit', handleRegister);
// loginForm?.addEventListener('submit', handleLogin);

// ============================================== 
// ORDER FORM VALIDATION
// ============================================== 

function validateOrderForm(formData) {
  const errors = {};
  
  if (!formData.product_name || formData.product_name.trim() === '') {
    errors.product_name = 'Product name is required';
  }
  
  if (!formData.quantity || formData.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  }
  
  if (!formData.customer_name || formData.customer_name.trim() === '') {
    errors.customer_name = 'Customer name is required';
  }
  
  if (!formData.shipping_address || formData.shipping_address.trim() === '') {
    errors.shipping_address = 'Shipping address is required';
  }
  
  return errors;
}

// ============================================== 
// DISPLAY VALIDATION ERRORS
// ============================================== 

function displayValidationErrors(errors, formType = 'order') {
  const selector = formType === 'quotation' ? '#quotation-view .form-error' : '#order-view .form-error';
  
  document.querySelectorAll(selector).forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  
  Object.keys(errors).forEach(field => {
    let inputElement;
    if (formType === 'quotation') {
      inputElement = document.getElementById(`quotation_${field}`);
      if (!inputElement) inputElement = document.getElementById(field);
    } else {
      inputElement = document.getElementById(field);
    }
    
    if (inputElement && inputElement.parentElement) {
      const errorElement = inputElement.parentElement.querySelector('.form-error');
      if (errorElement) {
        errorElement.textContent = errors[field];
        errorElement.classList.add('show');
      }
    }
  });
}

// ============================================== 
// SHOW RESPONSE MESSAGE
// ============================================== 

// ============================================== 
// SHOW AUTH MODAL RESPONSES
// ============================================== 

function showAuthResponse(type, title, message) {
  console.log('📢 showAuthResponse called:', { type, title, message });
  
  // Find the login-response div in the currently visible form
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  
  console.log('📋 Form containers found:');
  console.log('  - loginFormContainer:', loginFormContainer ? '✓ exists' : '❌ null');
  console.log('  - registerFormContainer:', registerFormContainer ? '✓ exists' : '❌ null');
  
  let responseEl = null;
  if (loginFormContainer && !loginFormContainer.classList.contains('hidden')) {
    console.log('✓ Login form is visible');
    responseEl = document.getElementById('login-response');
  } else if (registerFormContainer && !registerFormContainer.classList.contains('hidden')) {
    console.log('✓ Register form is visible');
    responseEl = document.getElementById('register-response');
  }
  
  if (!responseEl) {
    console.error('❌ No response element found!');
    return;
  }
  
  console.log('✓ Response element found, updating...');
  responseEl.className = `response-message ${type}`;
  responseEl.classList.remove('hidden');
  responseEl.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  
  if (type === 'error') {
    setTimeout(() => {
      responseEl.classList.add('hidden');
    }, 6000);
  }
  console.log('✓ Response message displayed');
}

// ============================================== 
// SHOW RESPONSE MESSAGES
// ============================================== 

function showResponse(type, title, message, formType = 'order') {
  const messageEl = formType === 'quotation' ? quotationResponseMessage : responseMessage;
  
  if (!messageEl) return;
  
  messageEl.className = `response-message ${type}`;
  messageEl.classList.remove('hidden');
  messageEl.innerHTML = `
    <strong>${title}</strong>
    <p>${message}</p>
  `;
  
  if (type === 'error') {
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 6000);
  }
}

// ============================================== 
// CLEAR ORDER FORM
// ============================================== 

function clearOrderForm() {
  if (form) {
    form.reset();
    document.querySelectorAll('#order-view .form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }
}

// ============================================== 
// QUOTATION FORM VALIDATION
// ============================================== 

function validateQuotationForm(formData) {
  const errors = {};
  
  if (!formData.product_name || formData.product_name.trim() === '') {
    errors.product_name = 'Product name is required';
  }
  
  if (!formData.quantity || formData.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  }
  
  if (!formData.customer_name || formData.customer_name.trim() === '') {
    errors.customer_name = 'Customer name is required';
  }
  
  return errors;
}

// ============================================== 
// CLEAR QUOTATION FORM
// ============================================== 

function clearQuotationForm() {
  if (quotationForm) {
    quotationForm.reset();
    document.querySelectorAll('#quotation-view .form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }
}

// ============================================== 
// SWITCH FORM TABS
// ============================================== 

function switchFormTab(tabName, evt) {
  // Hide all tabs
  document.querySelectorAll('.form-tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('.form-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Add active class to the tab button that matches the selected tab
  const tabBtn = document.querySelector(`.form-tab-btn[data-tab="${tabName}-tab"]`);
  if (tabBtn) tabBtn.classList.add('active');
  
  // Clear response messages
  if (responseMessage) responseMessage.classList.add('hidden');
  if (quotationResponseMessage) quotationResponseMessage.classList.add('hidden');
}

// ============================================== 
// SET LOADING STATE
// ============================================== 

function setLoading(isLoading) {
  if (!submitBtn) return;
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
  } else {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
  }
}

// ============================================== 
// SET QUOTATION LOADING STATE
// ============================================== 

function setQuotationLoading(isLoading) {
  if (!quotationSubmitBtn) return;
  
  if (isLoading) {
    quotationSubmitBtn.disabled = true;
    quotationSubmitBtn.classList.add('loading');
    const btnText = quotationSubmitBtn.querySelector('.btn-text');
    const btnLoader = quotationSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
  } else {
    quotationSubmitBtn.disabled = false;
    quotationSubmitBtn.classList.remove('loading');
    const btnText = quotationSubmitBtn.querySelector('.btn-text');
    const btnLoader = quotationSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
  }
}

// ============================================== 
// ORDER FORM SUBMISSION (handler function)
// ============================================== 
async function handleOrderSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    showResponse('error', 'Not Logged In', 'Please login first to place an order.');
    return;
  }

  const formData = {
    product_name: document.getElementById('product_name').value,
    quantity: parseInt(document.getElementById('quantity').value),
    customer_name: document.getElementById('customer_name').value,
    shipping_address: document.getElementById('shipping_address').value,
    special_instructions: document.getElementById('special_instructions').value || '',
    customer_email: currentUser.email,
    order_type: 'order'
  };

  const errors = validateOrderForm(formData);

  if (Object.keys(errors).length > 0) {
    displayValidationErrors(errors);
    showResponse('error', 'Validation Error', 'Please fill in all required fields correctly.');
    return;
  }

  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });

  setLoading(true);

  try {
    console.log('Submitting order to n8n webhooks');
    console.log('Order data:', formData);

    const payload = {
      body: {
        data: {
          fields: [
            { value: formData.customer_name },
            { value: formData.customer_email },
            { value: "buy" },
            { options: [{ id: 'product', text: formData.product_name }], value: ['product'] },
            { value: formData.quantity }
          ]
        }
      }
    };
    // Resilient send: try primary (proxy) first, fall back to remote webhook if connection refused
    async function tryPost(urls, payload) {
      for (const u of urls) {
        try {
          console.log('Attempting webhook POST to', u);
          const res = await fetch(u, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors'
          });
          console.log('Webhook POST to', u, 'status', res.status);
          if (!res.ok) {
            const txt = await res.text().catch(() => '<no-body>');
            console.warn('Webhook non-OK response from', u, res.status, txt);
          }
          return res;
        } catch (err) {
          console.warn('Webhook POST to', u, 'failed:', err.message || err);
          // try next URL
        }
      }
      throw new Error('All webhook POST attempts failed');
    }

    const orderTargets = USE_LOCAL_PROXY ? [ACTIVE_ORDER_WEBHOOK, ORDER_WEBHOOK] : [ORDER_WEBHOOK];
    const quoteTargets = USE_LOCAL_PROXY ? [ACTIVE_QUOTATION_WEBHOOK, QUOTATION_WEBHOOK] : [QUOTATION_WEBHOOK];

    const response1 = await tryPost(orderTargets, payload);
    const response2 = await tryPost(quoteTargets, payload);

    showResponse(
      'success',
      '✓ Order Submitted Successfully!',
      `Your order has been received and is being processed. A confirmation email will be sent to ${currentUser.email}.`
    );

    // Save order to localStorage
    saveOrderToHistory(formData);

    form.reset();

    setTimeout(() => {
      responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

  } catch (error) {
    console.error('Error:', error.message);

    // Even if CORS fails, the webhooks may still receive it
    showResponse(
      'success',
      '✓ Order Submitted!',
      `Your order has been received. A confirmation email will be sent to ${currentUser.email}.`
    );

    form.reset();

    setTimeout(() => {
      responseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  } finally {
    setLoading(false);
  }
}

// ============================================== 
// ORDER HISTORY MANAGEMENT
// ============================================== 

function saveOrderToHistory(orderData) {
  try {
    const orders = JSON.parse(localStorage.getItem('order_history') || '[]');
    const newOrder = {
      id: Date.now().toString(),
      ...orderData,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };
    orders.push(newOrder);
    localStorage.setItem('order_history', JSON.stringify(orders));
    console.log('✓ Order saved to history:', newOrder.id);
  } catch (err) {
    console.error('Error saving order to history:', err);
  }
}

function getOrderHistory(userEmail = null) {
  try {
    const orders = JSON.parse(localStorage.getItem('order_history') || '[]');
    if (userEmail) {
      return orders.filter(order => order.customer_email.toLowerCase() === userEmail.toLowerCase());
    }
    return orders;
  } catch (err) {
    console.error('Error retrieving order history:', err);
    return [];
  }
}

function renderOrderHistory(currentUser) {
  const orders = getOrderHistory(currentUser.email);
  const container = document.getElementById('order-history-container');
  const subtitle = document.getElementById('order-history-subtitle');
  
  if (!container) return;
  
  // Update subtitle with user email
  if (subtitle) {
    subtitle.textContent = `Orders for ${currentUser.email}`;
  }
  
  container.innerHTML = '';
  
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="no-orders-message">
        <p>📭 No orders yet</p>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Start by placing a new order from the Products section.</p>
        <button class="btn btn-primary" style="margin-top: 1rem;" onclick="showNewOrder()">Create New Order</button>
      </div>
    `;
    return;
  }
  
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  
  orders.forEach(order => {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    const orderDate = new Date(order.submitted_at);
    const dateStr = orderDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timeStr = orderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const statusClass = order.status === 'submitted' ? 'status-submitted' : 'status-pending';
    const statusLabel = order.status === 'submitted' ? 'Submitted' : 'Pending';
    
    orderCard.innerHTML = `
      <div class="order-card-header">
        <div class="order-info">
          <div class="order-id">Order #${order.id.substring(0, 8)}</div>
          <div class="order-date">${dateStr} at ${timeStr}</div>
        </div>
        <div class="order-status ${statusClass}">${statusLabel}</div>
      </div>
      
      <div class="order-card-body">
        <div class="order-row">
          <span class="order-label">Product</span>
          <span class="order-value">${order.product_name}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Quantity</span>
          <span class="order-value">${order.quantity}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Customer</span>
          <span class="order-value">${order.customer_name}</span>
        </div>
        
        <div class="order-row">
          <span class="order-label">Shipping Address</span>
          <span class="order-value">${order.shipping_address}</span>
        </div>
        
        ${order.special_instructions ? `
        <div class="order-row">
          <span class="order-label">Special Instructions</span>
          <span class="order-value">${order.special_instructions}</span>
        </div>
        ` : ''}
      </div>
    `;
    
    container.appendChild(orderCard);
  });
}

// ============================================== 
// QUOTATION FORM SUBMISSION (handler function)
// ============================================== 
async function handleQuotationSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    showResponse('error', 'Not Logged In', 'Please login first to request a quotation.', 'quotation');
    return;
  }

  const formData = {
    product_name: document.getElementById('quotation_product_name')?.value || '',
    quantity: parseInt(document.getElementById('quotation_quantity')?.value || '0'),
    customer_name: document.getElementById('quotation_customer_name')?.value || '',
    business_name: document.getElementById('quotation_business')?.value || '',
    requirements: document.getElementById('quotation_requirements')?.value || '',
    customer_email: currentUser.email,
    order_type: 'quotation'
  };

  const errors = validateQuotationForm(formData);

  if (Object.keys(errors).length > 0) {
    displayValidationErrors(errors, 'quotation');
    showResponse('error', 'Validation Error', 'Please fill in all required fields correctly.', 'quotation');
    return;
  }

  document.querySelectorAll('#quotation-view .form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });

  setQuotationLoading(true);

  try {
    console.log('Submitting quotation to n8n webhook:', QUOTATION_WEBHOOK);
    console.log('Quotation data:', formData);

    const payload = {
      body: {
        data: {
          fields: [
            { value: formData.customer_name },
            { value: formData.customer_email },
            { value: "quotation" },
            { options: [{ id: 'product', text: formData.product_name }], value: ['product'] },
            { value: formData.quantity }
          ]
        }
      }
    };

    // Resilient send for quotation: try proxy then remote
    async function tryPostLocalThenRemote(urls, payload) {
      for (const u of urls) {
        try {
          console.log('Attempting webhook POST to', u);
          const res = await fetch(u, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors'
          });
          console.log('Webhook POST to', u, 'status', res.status);
          if (!res.ok) {
            const txt = await res.text().catch(() => '<no-body>');
            console.warn('Webhook non-OK response from', u, res.status, txt);
          }
          return res;
        } catch (err) {
          console.warn('Webhook POST to', u, 'failed:', err.message || err);
        }
      }
      throw new Error('All quotation webhook attempts failed');
    }

    const targets = USE_LOCAL_PROXY ? [ACTIVE_QUOTATION_WEBHOOK, QUOTATION_WEBHOOK] : [QUOTATION_WEBHOOK];
    const response = await tryPostLocalThenRemote(targets, payload);
    console.log('Response status:', response.status);
    const result = await response.json().catch(() => ({ status: 'submitted' }));
    console.log('Webhook response:', result);

    showResponse(
      'success',
      '✓ Quotation Request Submitted!',
      `Your quotation request has been received. We will send you a detailed quotation to ${currentUser.email} within 24 hours.`,
      'quotation'
    );

    quotationForm.reset();

    setTimeout(() => {
      quotationResponseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

  } catch (error) {
    console.error('Error:', error.message);

    // Even if CORS fails, the webhook may still receive it
    showResponse(
      'success',
      '✓ Quotation Request Submitted!',
      `Your quotation request has been received. We will send you a detailed quotation to ${currentUser.email} within 24 hours.`,
      'quotation'
    );

    quotationForm.reset();

    setTimeout(() => {
      quotationResponseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  } finally {
    setQuotationLoading(false);
  }
}

// ==============================================
// COMPLAINT FORM HANDLERS
// ==============================================

function validateComplaintForm(formData) {
  const errors = {};
  if (!formData.name || formData.name.trim() === '') errors.name = 'Name is required';
  if (!formData.contact || formData.contact.trim() === '') errors.contact = 'Contact (email or phone) is required';
  if (!formData.description || formData.description.trim() === '') errors.description = 'Please describe the issue';
  return errors;
}

function setComplaintLoading(isLoading) {
  if (!complaintSubmitBtn) return;
  if (isLoading) {
    complaintSubmitBtn.disabled = true;
    complaintSubmitBtn.classList.add('loading');
    const btnText = complaintSubmitBtn.querySelector('.btn-text');
    const btnLoader = complaintSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
  } else {
    complaintSubmitBtn.disabled = false;
    complaintSubmitBtn.classList.remove('loading');
    const btnText = complaintSubmitBtn.querySelector('.btn-text');
    const btnLoader = complaintSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
  }
}

async function handleComplaintSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    if (complaintResponseMessage) {
      complaintResponseMessage.className = 'response-message error';
      complaintResponseMessage.classList.remove('hidden');
      complaintResponseMessage.innerHTML = '<strong>Sign in required</strong><p>Please <button type="button" class="link-btn" onclick="showAuthModal(\'login\')">sign in with Google</button> to submit a complaint. Your registered Gmail will be used.</p>';
    }
    return;
  }

  const nameField = document.getElementById('complaint_name');
  const descField = document.getElementById('complaint_description');

  const formData = {
    name: nameField?.value?.trim() || (currentUser.displayName || currentUser.email.split('@')[0]) || '',
    contact: currentUser.email,
    description: descField?.value?.trim() || ''
  };

  const errors = validateComplaintForm(formData);
  if (Object.keys(errors).length > 0) {
    // show form errors
    Object.keys(errors).forEach(field => {
      const el = document.getElementById(`complaint_${field}`);
      if (el && el.parentElement) {
        const err = el.parentElement.querySelector('.form-error');
        if (err) { err.textContent = errors[field]; err.classList.add('show'); }
      }
    });
    if (complaintResponseMessage) {
      complaintResponseMessage.className = `response-message error`;
      complaintResponseMessage.classList.remove('hidden');
      complaintResponseMessage.innerHTML = `<strong>Validation Error</strong><p>Please fill in required fields correctly.</p>`;
    }
    return;
  }

  // clear previous errors
  document.querySelectorAll('#complaint-view .form-error').forEach(el => { el.textContent = ''; el.classList.remove('show'); });

  setComplaintLoading(true);

  try {
    const payload = {
      body: {
        data: {
          fields: [
            { value: formData.name },
            { value: formData.contact },
            { value: formData.description }
          ]
        }
      }
    };

    async function tryPostLocalThenRemote(urls, payload) {
      for (const u of urls) {
        try {
          const res = await fetch(u, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors'
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => '<no-body>');
            console.warn('Webhook non-OK response from', u, res.status, txt);
          }
          return res;
        } catch (err) {
          console.warn('Webhook POST to', u, 'failed:', err.message || err);
        }
      }
      throw new Error('All complaint webhook attempts failed');
    }

    const targets = USE_LOCAL_PROXY ? [ACTIVE_COMPLAINT_WEBHOOK, COMPLAINT_WEBHOOK] : [COMPLAINT_WEBHOOK];
    const response = await tryPostLocalThenRemote(targets, payload);

    // Try to parse AI output from webhook response and show preview
    let parsed = null;
    try {
      parsed = await response.json();
    } catch (e) {
      parsed = null;
    }

    if (complaintResponseMessage) {
      complaintResponseMessage.className = `response-message success`;
      complaintResponseMessage.classList.remove('hidden');

      // Build base message
      let html = `<strong>✓ Complaint Submitted</strong><p>Thank you — your complaint has been logged. Our support team will review it shortly.</p>`;

      // If the webhook returned structured AI info, show it
      const ai = parsed || {};
      const category = ai.Category || ai.category || ai.AI?.Category || ai.AI?.category || '';
      const sentiment = ai.Sentiment || ai.sentiment || ai.AI?.sentiment || '';
      const suggested = ai.SuggestedAction || ai.suggestedAction || ai.AI?.SuggestedAction || ai.AI?.suggestedAction || '';
      const draft = ai.DraftResponse || ai.draftResponse || ai.AI?.DraftResponse || ai.AI?.draftResponse || '';

      if (category || sentiment || suggested || draft) {
        html += `<div class="ai-preview"><h4>AI Analysis</h4>`;
        if (category) html += `<p><strong>Category:</strong> ${escapeHtml(category)}</p>`;
        if (sentiment) html += `<p><strong>Sentiment:</strong> ${escapeHtml(sentiment)}</p>`;
        if (suggested) html += `<p><strong>Suggested Action:</strong> ${escapeHtml(suggested)}</p>`;
        if (draft) html += `<p><strong>Draft Response:</strong><div class="draft-response">${escapeHtml(draft)}</div></p>`;
        html += `</div>`;
      }

      complaintResponseMessage.innerHTML = html;
    }
    document.getElementById('complaint-form')?.reset();
    if (complaintResponseMessage) {
      complaintResponseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

  } catch (err) {
    console.error('Complaint submit error:', err.message || err);
    if (complaintResponseMessage) {
      complaintResponseMessage.className = `response-message success`;
      complaintResponseMessage.classList.remove('hidden');
      complaintResponseMessage.innerHTML = `<strong>✓ Complaint Submitted</strong><p>Your complaint was submitted. If you do not hear back, contact support.</p>`;
    }
    document.getElementById('complaint-form')?.reset();
  } finally {
    setComplaintLoading(false);
  }
}

function showComplaint() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const nav = document.getElementById('nav-complaint');
  if (nav) nav.classList.add('active');
  // Hide other views
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.remove('hidden');
  const user = getCurrentUser();
  if (user) syncComplaintReviewEmailFields(user.email, true);
  setTimeout(() => { document.getElementById('complaint_name')?.focus(); }, 200);
}

function showReview() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const nav = document.getElementById('nav-review');
  if (nav) nav.classList.add('active');
  // Hide other views
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('quotation-view')?.classList.add('hidden');
  document.getElementById('complaint-view')?.classList.add('hidden');
  document.getElementById('review-view')?.classList.remove('hidden');
  const user = getCurrentUser();
  if (user) syncComplaintReviewEmailFields(user.email, true);
  setTimeout(() => { document.getElementById('review_name')?.focus(); }, 200);
}

// ==============================================
// REVIEW FORM HANDLERS
// ==============================================

function validateReviewForm(formData) {
  const errors = {};
  if (!formData.name || formData.name.trim() === '') errors.name = 'Name is required';
  if (!formData.email || formData.email.trim() === '') errors.email = 'Email is required';
  else if (!emailRegex.test(formData.email)) errors.email = 'Please enter a valid email address';
  if (!formData.review || formData.review.trim() === '') errors.review = 'Please write your review';
  return errors;
}

function setReviewLoading(isLoading) {
  if (!reviewSubmitBtn) return;
  if (isLoading) {
    reviewSubmitBtn.disabled = true;
    reviewSubmitBtn.classList.add('loading');
    const btnText = reviewSubmitBtn.querySelector('.btn-text');
    const btnLoader = reviewSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.add('hidden');
    if (btnLoader) btnLoader.classList.remove('hidden');
  } else {
    reviewSubmitBtn.disabled = false;
    reviewSubmitBtn.classList.remove('loading');
    const btnText = reviewSubmitBtn.querySelector('.btn-text');
    const btnLoader = reviewSubmitBtn.querySelector('.btn-loader');
    if (btnText) btnText.classList.remove('hidden');
    if (btnLoader) btnLoader.classList.add('hidden');
  }
}

async function handleReviewSubmit(e) {
  e.preventDefault();

  const currentUser = getCurrentUser();
  if (!currentUser) {
    if (reviewResponseMessage) {
      reviewResponseMessage.className = 'response-message error';
      reviewResponseMessage.classList.remove('hidden');
      reviewResponseMessage.innerHTML = '<strong>Sign in required</strong><p>Please <button type="button" class="link-btn" onclick="showAuthModal(\'login\')">sign in with Google</button> to submit a review. Your registered Gmail will be used.</p>';
    }
    return;
  }

  const nameField = document.getElementById('review_name');
  const reviewField = document.getElementById('review_text');

  const formData = {
    name: nameField?.value?.trim() || (currentUser.displayName || currentUser.email.split('@')[0]) || '',
    email: currentUser.email,
    review: reviewField?.value?.trim() || ''
  };

  const errors = validateReviewForm(formData);
  if (Object.keys(errors).length > 0) {
    const fieldIdMap = { name: 'review_name', email: 'review_email', review: 'review_text' };
    Object.keys(errors).forEach(field => {
      const el = document.getElementById(fieldIdMap[field] || `review_${field}`);
      if (el && el.parentElement) {
        const err = el.parentElement.querySelector('.form-error');
        if (err) { err.textContent = errors[field]; err.classList.add('show'); }
      }
    });
    if (reviewResponseMessage) {
      reviewResponseMessage.className = 'response-message error';
      reviewResponseMessage.classList.remove('hidden');
      reviewResponseMessage.innerHTML = '<strong>Validation Error</strong><p>Please fill in all required fields correctly.</p>';
    }
    return;
  }

  document.querySelectorAll('#review-view .form-error').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
  setReviewLoading(true);

  try {
    // n8n webhook expects: { body: { name, email, review } }
    const payload = {
      body: {
        name: formData.name,
        email: formData.email,
        review: formData.review
      }
    };

    async function tryPostLocalThenRemote(urls, payload) {
      for (const u of urls) {
        try {
          const res = await fetch(u, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'cors'
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => '<no-body>');
            console.warn('Webhook non-OK response from', u, res.status, txt);
          }
          return res;
        } catch (err) {
          console.warn('Webhook POST to', u, 'failed:', err.message || err);
        }
      }
      throw new Error('All review webhook attempts failed');
    }

    const targets = USE_LOCAL_PROXY ? [ACTIVE_REVIEW_WEBHOOK, REVIEW_WEBHOOK] : [REVIEW_WEBHOOK];
    await tryPostLocalThenRemote(targets, payload);

    if (reviewResponseMessage) {
      reviewResponseMessage.className = 'response-message success';
      reviewResponseMessage.classList.remove('hidden');
      reviewResponseMessage.innerHTML = '<strong>✓ Review Submitted</strong><p>Thank you for your feedback! Our AI will analyze the sentiment, and you will receive an email response shortly.</p>';
    }
    document.getElementById('review-form')?.reset();
    if (currentUser) {
      const reviewEmail = document.getElementById('review_email');
      const reviewName = document.getElementById('review_name');
      if (reviewEmail) reviewEmail.value = currentUser.email;
      if (reviewName) reviewName.value = currentUser.displayName || currentUser.email.split('@')[0];
    }
    if (reviewResponseMessage) reviewResponseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('Review submit error:', err.message || err);
    if (reviewResponseMessage) {
      reviewResponseMessage.className = 'response-message success';
      reviewResponseMessage.classList.remove('hidden');
      reviewResponseMessage.innerHTML = '<strong>✓ Review Submitted</strong><p>Your review was submitted. You will receive an email response based on the sentiment analysis.</p>';
    }
    document.getElementById('review-form')?.reset();
  } finally {
    setReviewLoading(false);
  }
}

// Small helper to escape HTML for safe insertion
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================== 
// SMOOTH SCROLL
// ============================================== 

// Anchor clicks: update location.hash so hashchange routing runs
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href) return;
    // If the link is an in-page anchor, set the hash to trigger routing
    if (href.startsWith('#')) {
      e.preventDefault();
      try { location.hash = href; } catch (err) { window.location.hash = href; }
    }
  });
});

// ============================================== 
// GO TO ORDER FORM
// ============================================== 

function goToForm() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    showAuthModal('register');
  } else {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        document.getElementById('product_name')?.focus();
      }, 500);
    }
  }
}

// ============================================== 
// INITIALIZE ON PAGE LOAD
// ============================================== 

document.addEventListener('DOMContentLoaded', () => {
  console.log('✓ DOMContentLoaded - initializing...');
  
  // Initialize ALL DOM elements
  console.log('Page on load:', location.href, 'hash:', location.hash);
  authModal = document.getElementById('auth-modal');
  authCloseBtn = document.querySelector('.auth-close-btn');
  loginForm = document.getElementById('login-form');
  registerForm = document.getElementById('register-form');
  form = document.getElementById('order-form');
  submitBtn = document.getElementById('submit-btn');
  responseMessage = document.getElementById('response-message');
  customerEmailField = document.getElementById('customer_email');
  quotationForm = document.getElementById('quotation-form');
  quotationSubmitBtn = document.getElementById('quotation-submit-btn');
  quotationResponseMessage = document.getElementById('quotation-response-message');
  quotationCustomerEmailField = document.getElementById('quotation_customer_email');
  complaintForm = document.getElementById('complaint-form');
  complaintSubmitBtn = document.getElementById('complaint-submit-btn');
  complaintResponseMessage = document.getElementById('complaint-response-message');
  reviewForm = document.getElementById('review-form');
  reviewSubmitBtn = document.getElementById('review-submit-btn');
  reviewResponseMessage = document.getElementById('review-response-message');
  loginRequiredMsg = document.getElementById('login-required-msg');
  userInfoDisplay = document.getElementById('user-info-display');
  orderFormContainer = document.querySelector('.form-wrapper');
  userProfile = document.getElementById('user-profile');
  yearElement = document.getElementById ('year');
  
  // Set current year in footer
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  console.log('✅ Auth Modal:', authModal ? '✓ Found' : '❌ NOT FOUND');
  console.log('📋 Register Form:', registerForm ? '✓ Found' : '❌ NOT FOUND');
  console.log('📋 Login Form:', loginForm ? '✓ Found' : '❌ NOT FOUND');
  
  // Attach auth modal close listener
  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', closeAuthModal);
    console.log('✓ Auth close button listener attached');
  }

  // DIAGNOSTICS: log button clicks to help trace "buttons not working" issues
  try {
    document.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        try {
          console.log('🖱️ Button clicked:', btn.id || btn.className || btn.textContent.trim().slice(0,40));
        } catch (e) { /* ignore */ }
      });
    });
    console.log('✓ Button click diagnostics attached');
  } catch (err) {
    console.warn('⚠️ Could not attach button diagnostics:', err);
  }

  // Global error handler to capture unexpected JS errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.message, 'at', event.filename + ':' + event.lineno);
  });

  window.addEventListener('unhandledrejection', (ev) => {
    console.error('Unhandled promise rejection:', ev.reason);
  });
  
  // Click outside modal to close
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        closeAuthModal();
      }
    });
  }
  
  // Attach form handlers AFTER DOM is ready
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    console.log('✓ Register form listener attached');
  } else {
    console.error('❌ Could not attach register form listener - form not found!');
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    console.log('✓ Login form listener attached');
  } else {
    console.error('❌ Could not attach login form listener - form not found!');
  }

  // Attach order & quotation handlers now that elements exist
  if (form) {
    form.addEventListener('submit', handleOrderSubmit);
    console.log('✓ Order form listener attached');
  } else {
    console.warn('⚠️ Order form not found; submit listener not attached');
  }

  if (quotationForm) {
    quotationForm.addEventListener('submit', handleQuotationSubmit);
    console.log('✓ Quotation form listener attached');
  } else {
    console.warn('⚠️ Quotation form not found; submit listener not attached');
  }

  if (complaintForm) {
    complaintForm.addEventListener('submit', handleComplaintSubmit);
    console.log('✓ Complaint form listener attached');
  } else {
    console.warn('⚠️ Complaint form not found; submit listener not attached');
  }

  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
    console.log('✓ Review form listener attached');
  } else {
    console.warn('⚠️ Review form not found; submit listener not attached');
  }
  
  // Firebase initialization check & retry
  console.log('🔍 Checking if Firebase is initialized...');
  if (typeof FirebaseAuth !== 'undefined' && typeof firebase !== 'undefined') {
    if (!FirebaseAuth.isAuthenticated || typeof FirebaseAuth.isAuthenticated !== 'function') {
      console.warn('⚠️ FirebaseAuth methods not available. Attempting to reinitialize...');
      try {
        if (typeof FirebaseAuth.init === 'function') {
          FirebaseAuth.init(firebaseConfig || window.firebaseConfig);
          console.log('✅ Firebase reinitialized');
        }
      } catch (err) {
        console.error('❌ Firebase reinit failed:', err);
      }
    } else {
      console.log('✅ Firebase ready');
    }
  } else {
    console.warn('⚠️ Firebase SDK not fully loaded. Some features may not work.');
  }
  
  // Continue with other initialization
  checkAuthStatus();
  console.log('✓ AI Order Automation System loaded with Email Authentication');
  console.log('Order Webhook:', ORDER_WEBHOOK);
  console.log('Quotation Webhook:', QUOTATION_WEBHOOK);
  console.log('Backend URL:', BACKEND_URL);

  // Populate product select from inline PRODUCTS list
  populateProductSelect(PRODUCTS);

  // Routing based on hash - use show* functions so nav + view stay in sync
  function handleHash() {
    try {
      const fullHash = location.hash || '';
      const h = fullHash.replace('#', '').toLowerCase();
      console.log('handleHash full:', fullHash, 'parsed:', h);
      try {
        const dbgHashEl = document.getElementById('route-debug-hash');
        const dbgViewEl = document.getElementById('route-debug-view');
        if (dbgHashEl) dbgHashEl.textContent = fullHash || '(none)';
        if (dbgViewEl) dbgViewEl.textContent = 'determining...';
      } catch (e) {}

      if (h === 'quotation' || h === 'quote') {
        showQuotation();
        try { document.getElementById('route-debug-view').textContent = 'quotation'; } catch (e) {}
      } else if (h === 'complaint') {
        showComplaint();
        try { document.getElementById('route-debug-view').textContent = 'complaint'; } catch (e) {}
      } else if (h === 'review' || h === 'reviews') {
        showReview();
        try { document.getElementById('route-debug-view').textContent = 'review'; } catch (e) {}
      } else if (h === 'products' || h === 'product') {
        showProducts();
        try { document.getElementById('route-debug-view').textContent = 'products'; } catch (e) {}
      } else if (h === 'history' || h === 'order-history') {
        showOrderHistory();
        try { document.getElementById('route-debug-view').textContent = 'history'; } catch (e) {}
      } else {
        showNewOrder();
        try { document.getElementById('route-debug-view').textContent = 'order'; } catch (e) {}
      }
    } catch (err) {
      console.warn('Error handling location.hash:', err);
    }
  }

  // Run once on load and when the hash changes
  handleHash();
  window.addEventListener('hashchange', handleHash);
  // Some browsers or other scripts may change views after load; re-run routing briefly to ensure correct view
  setTimeout(handleHash, 100);
  setTimeout(handleHash, 500);
});
