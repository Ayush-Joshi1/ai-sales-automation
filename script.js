// ============================================== 
// AI ORDER AUTOMATION SYSTEM - JAVASCRIPT
// Email-Based Authentication + Order Form Integration
// ============================================== 

// Configuration
const ORDER_WEBHOOK = 'https://amit19.app.n8n.cloud/webhook/tally-sales-order';
const QUOTATION_WEBHOOK = 'https://amit19.app.n8n.cloud/webhook/generate-invoice';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Load products from products.json (includes real image URLs)
let PRODUCTS = [];
(async () => {
  try {
    const res = await fetch('products.json');
    PRODUCTS = await res.json();
    console.log('✓ Loaded', PRODUCTS.length, 'products');
  } catch (err) {
    console.warn('Could not load products.json:', err.message);
    PRODUCTS = [];
  }
})();

// DOM Elements - Auth Modal
const authModal = document.getElementById('auth-modal');
const authCloseBtn = document.querySelector('.auth-close-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// DOM Elements - Order Form
const form = document.getElementById('order-form');
const submitBtn = document.getElementById('submit-btn');
const responseMessage = document.getElementById('response-message');
const customerEmailField = document.getElementById('customer_email');

// DOM Elements - Quotation Form
const quotationForm = document.getElementById('quotation-form');
const quotationSubmitBtn = document.getElementById('quotation-submit-btn');
const quotationResponseMessage = document.getElementById('quotation-response-message');
const quotationCustomerEmailField = document.getElementById('quotation_customer_email');

// DOM Elements - Common
const loginRequiredMsg = document.getElementById('login-required-msg');
const userInfoDisplay = document.getElementById('user-info-display');
const orderFormContainer = document.querySelector('.form-wrapper');
const userProfile = document.getElementById('user-profile');

// DOM Elements - Other
const yearElement = document.getElementById('year');

// Set current year in footer
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// Products are provided inline in `PRODUCTS` constant above.

function populateProductSelect(products) {
  const select = document.getElementById('product_name');
  if (!select || !Array.isArray(products) || products.length === 0) return;
  // Remove any non-placeholder options (keep first placeholder)
  while (select.options.length > 1) select.remove(1);
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  products.forEach(prod => {
    const opt = document.createElement('option');
    // Keep value as product name so existing order code continues to work
    opt.value = prod.name;
    const priceText = formatter.format(prod.priceINR);
    opt.textContent = `${prod.name} — ${priceText} (${prod.stock} in stock)`;
    select.appendChild(opt);
  });
}

// =====================
// Products gallery + modal
// =====================
function showProducts() {
  // toggle nav active
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-products')?.classList.add('active');

  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('products-view')?.classList.remove('hidden');
  // render products
  renderProducts(PRODUCTS);
}

function showNewOrder() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-new-order')?.classList.add('active');
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.remove('hidden');
}

function showOrderHistory(){
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  // Update nav
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('nav-order-history')?.classList.add('active');
  document.getElementById('products-view')?.classList.add('hidden');
  document.getElementById('order-view')?.classList.add('hidden');
  document.getElementById('order-history-view')?.classList.remove('hidden');
  
  // Load and display orders for this user
  renderOrderHistory(currentUser);
}

function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const thumb = document.createElement('div');
    thumb.className = 'product-thumb';
    const img = document.createElement('img');
    // Use a placeholder image service with a query to vary images by id
    img.src = `https://source.unsplash.com/collection/190727/800x600?sig=${encodeURIComponent(p.id)}`;
    img.alt = p.name;
    thumb.appendChild(img);

    const title = document.createElement('div');
    title.className = 'product-title';
    title.textContent = p.name;

    const meta = document.createElement('div');
    meta.className = 'product-meta';
    meta.textContent = `${p.stock} in stock • ${p.id}`;

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = formatter.format(p.priceINR);

    const actions = document.createElement('div');
    actions.className = 'product-actions';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-small-ghost';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => openProductModal(p.id));

    const orderBtn = document.createElement('button');
    orderBtn.className = 'btn btn-primary btn-small';
    orderBtn.textContent = 'Order';
    orderBtn.addEventListener('click', () => {
      // select product in order form and switch to order view
      const select = document.getElementById('product_name');
      if (select) {
        // find option with this name, else add it
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

    actions.appendChild(viewBtn);
    actions.appendChild(orderBtn);

    card.appendChild(thumb);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(price);
    card.appendChild(actions);

    grid.appendChild(card);
  });

  // wire search
  const search = document.getElementById('product-search');
  if (search) {
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
      renderProducts(filtered);
    };
  }
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
        <img src="https://source.unsplash.com/collection/190727/400x300?sig=${encodeURIComponent(p.id)}" style="width:45%;border-radius:8px;object-fit:cover" />
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
// AUTH STATE MANAGEMENT
// ============================================== 

function getRegisteredUsers() {
  const users = localStorage.getItem('registered_users');
  return users ? JSON.parse(users) : [];
}

function getCurrentUser() {
  const user = localStorage.getItem('current_user');
  return user ? JSON.parse(user) : null;
}

function saveRegisteredUsers(users) {
  localStorage.setItem('registered_users', JSON.stringify(users));
}

function saveCurrentUser(user) {
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('current_user');
  }
}

// ============================================== 
// CHECK AUTH STATUS ON PAGE LOAD
// ============================================== 

function checkAuthStatus() {
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    displayUserLoggedIn(currentUser);
  } else {
    displayUserLoggedOut();
  }
}

// ============================================== 
// UPDATE UI FOR LOGGED IN USER
// ============================================== 

function displayUserLoggedIn(user) {
  // Hide auth navigation button
  const authNav = document.getElementById('auth-nav');
  if (authNav) authNav.classList.add('hidden');
  
  // Show user profile
  if (userProfile) {
    userProfile.classList.remove('hidden');
    userProfile.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="color: #94a3b8;">Welcome, <strong>${user.name}</strong></span>
        <button class="btn btn-outline btn-small" style="padding: 0.5rem 1rem; font-size: 0.875rem;" onclick="logout()">Logout</button>
      </div>
    `;
  }
  
  // Show order form and hide login message
  if (loginRequiredMsg) loginRequiredMsg.classList.add('hidden');
  if (userInfoDisplay) {
    userInfoDisplay.classList.remove('hidden');
    const formUserEmail = document.getElementById('form-user-email');
    if (formUserEmail) formUserEmail.textContent = user.email;
  }
  if (form) form.classList.add('visible');
  
  // Auto-populate customer email for both forms
  if (customerEmailField) {
    customerEmailField.value = user.email;
  }
  if (quotationCustomerEmailField) {
    quotationCustomerEmailField.value = user.email;
  }
}

// ============================================== 
// UPDATE UI FOR LOGGED OUT USER
// ============================================== 

function displayUserLoggedOut() {
  // Show auth navigation button
  const authNav = document.getElementById('auth-nav');
  if (authNav) authNav.classList.remove('hidden');
  
  // Hide user profile
  if (userProfile) userProfile.classList.add('hidden');
  
  // Hide order form and show login message
  if (loginRequiredMsg) loginRequiredMsg.classList.remove('hidden');
  if (userInfoDisplay) userInfoDisplay.classList.add('hidden');
  if (form) form.classList.remove('visible');
  
  // Clear customer email field
  if (customerEmailField) customerEmailField.value = '';
}

// ============================================== 
// AUTH MODAL HANDLERS
// ============================================== 

function showAuthModal(formType = 'login') {
  authModal.classList.remove('hidden');
  
  if (formType === 'login') {
    switchAuthForm('login');
  } else {
    switchAuthForm('register');
  }
}

function closeAuthModal() {
  authModal.classList.add('hidden');
  loginForm.reset();
  registerForm.reset();
}

function switchAuthForm(type) {
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  
  if (type === 'login') {
    if (loginFormContainer) loginFormContainer.classList.remove('hidden');
    if (registerFormContainer) registerFormContainer.classList.add('hidden');
  } else {
    if (loginFormContainer) loginFormContainer.classList.add('hidden');
    if (registerFormContainer) registerFormContainer.classList.remove('hidden');
  }
}

// ============================================== 
// AUTH EVENT LISTENERS
// ============================================== 

authCloseBtn?.addEventListener('click', closeAuthModal);

// Click outside modal to close
authModal?.addEventListener('click', (e) => {
  if (e.target === authModal) {
    closeAuthModal();
  }
});

// ============================================== 
// REGISTRATION HANDLER
// ============================================== 

async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('register_email').value.trim();
  const name = document.getElementById('register_name').value.trim();
  const password = document.getElementById('register_password').value;
  const confirmPassword = document.getElementById('register_confirm').value;

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

  // Check if email already registered
  if (!errorMsg) {
    const users = getRegisteredUsers();
    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      errorMsg = 'This email is already registered. Please login instead.';
      errorField = 'register_email';
    }
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

  // Send OTP to email
  try {
    setRegisterPendingState(true);
    const resp = await sendOtpRequest(email);
    if (resp && resp.success) {
      showOtpUI({ email, name, password });
      showResponse('info', 'OTP Sent', 'We sent a 6-digit code to your email. Enter it below to verify.');
    } else {
      showResponse('error', 'OTP Failed', resp?.error || 'Unable to send OTP.');
    }
  } catch (err) {
    console.error('send-otp error', err);
    showResponse('error', 'OTP Error', 'Failed to send OTP. Check server logs.');
  } finally {
    setRegisterPendingState(false);
  }
}

function setRegisterPendingState(isPending) {
  const btn = document.querySelector('#register-form button[type="submit"]');
  if (!btn) return;
  btn.disabled = isPending;
}

async function sendOtpRequest(email) {
  const res = await fetch('http://localhost:5000/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json().catch(() => ({ success: false, error: 'Network error' }));
}

async function verifyOtpRequest(email, otp) {
  const res = await fetch('http://localhost:5000/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  return res.json().catch(() => ({ success: false, error: 'Network error' }));
}

function showOtpUI({ email, name, password }) {
  const registerFormContainer = document.getElementById('register-form-container');
  if (!registerFormContainer) return;

  // Remove existing otp container if any
  let otpContainer = document.getElementById('otp-container');
  if (otpContainer) otpContainer.remove();

  otpContainer = document.createElement('div');
  otpContainer.id = 'otp-container';
  otpContainer.className = 'otp-container';
  otpContainer.innerHTML = `
    <div class="form-group">
      <label class="form-label">Enter OTP</label>
      <input type="text" id="register_otp" maxlength="6" placeholder="6-digit code">
      <div class="form-error" id="otp-error"></div>
    </div>
    <div style="display:flex;gap:0.75rem;">
      <button type="button" id="verify-otp-btn" class="btn btn-primary">Verify OTP</button>
      <button type="button" id="resend-otp-btn" class="btn btn-outline">Resend</button>
    </div>
  `;

  registerFormContainer.appendChild(otpContainer);

  document.getElementById('verify-otp-btn')?.addEventListener('click', async () => {
    const otpInput = document.getElementById('register_otp');
    const otp = otpInput?.value.trim();
    const otpError = document.getElementById('otp-error');
    if (!otp || otp.length < 6) {
      if (otpError) otpError.textContent = 'Enter the 6-digit code';
      return;
    }
    if (otpError) otpError.textContent = '';

    const resp = await verifyOtpRequest(email, otp);
    if (resp && resp.success) {
      // Complete registration locally
      const users = getRegisteredUsers();
      const newUser = { email, name, password, registeredAt: new Date().toISOString() };
      users.push(newUser);
      saveRegisteredUsers(users);
      saveCurrentUser({ email: newUser.email, name: newUser.name });
      closeAuthModal();
      checkAuthStatus();
      showResponse('success', '✓ Account Created!', `Welcome ${newUser.name}! Your account is verified.`);
      // cleanup
      otpContainer.remove();
      registerForm.reset();
    } else {
      if (otpError) otpError.textContent = resp?.error || 'OTP verification failed';
    }
  });

  document.getElementById('resend-otp-btn')?.addEventListener('click', async () => {
    setRegisterPendingState(true);
    await sendOtpRequest(email);
    setRegisterPendingState(false);
    showResponse('info', 'OTP Resent', 'A new code was sent to your email.');
  });
}

// ============================================== 
// LOGIN HANDLER
// ============================================== 

function handleLogin(e) {
  e.preventDefault();
  
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
  
  if (!errorMsg) {
    const users = getRegisteredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      errorMsg = 'Email not found. Please register first.';
      errorField = 'login_email';
    } else if (user.password !== password) {
      errorMsg = 'Incorrect password. Please try again.';
      errorField = 'login_password';
    }
  }
  
  // Show error if login failed
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
  
  // Login successful
  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  saveCurrentUser({ email: user.email, name: user.name });
  
  // Close modal and update UI
  closeAuthModal();
  checkAuthStatus();
  
  // Show success message
  showResponse('success', '✓ Login Successful!', `Welcome back, ${user.name}!`);
}

// ============================================== 
// LOGOUT HANDLER
// ============================================== 

function logout() {
  saveCurrentUser(null);
  checkAuthStatus();
  
  // Close modal
  closeAuthModal();
  
  // Show logout message
  showResponse('info', '✓ Logged Out', 'You have been logged out. See you soon!');
}

// Attach form handlers
registerForm?.addEventListener('submit', handleRegister);
loginForm?.addEventListener('submit', handleLogin);

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
  const tab = formType === 'quotation' ? '#quotation-tab' : '#order-tab';
  const selector = formType === 'quotation' ? '#quotation-tab .form-error' : '#order-tab .form-error';
  
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
    document.querySelectorAll('#order-tab .form-error').forEach(el => {
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
    errors.quotation_product_name = 'Product name is required';
  }
  
  if (!formData.quantity || formData.quantity < 1) {
    errors.quotation_quantity = 'Quantity must be at least 1';
  }
  
  if (!formData.customer_name || formData.customer_name.trim() === '') {
    errors.quotation_customer_name = 'Customer name is required';
  }
  
  return errors;
}

// ============================================== 
// CLEAR QUOTATION FORM
// ============================================== 

function clearQuotationForm() {
  if (quotationForm) {
    quotationForm.reset();
    document.querySelectorAll('#quotation-tab .form-error').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }
}

// ============================================== 
// SWITCH FORM TABS
// ============================================== 

function switchFormTab(tabName) {
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
  
  // Add active class to clicked button
  event.target.closest('.form-tab-btn').classList.add('active');
  
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
// ORDER FORM SUBMISSION
// ============================================== 

form?.addEventListener('submit', async (e) => {
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
    
    // Send to ORDER webhook
    console.log('Sending to ORDER_WEBHOOK:', ORDER_WEBHOOK);
    const response1 = await fetch(ORDER_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    console.log('ORDER webhook response status:', response1.status);
    
    // ALSO send to QUOTATION webhook with if1: "buy"
    console.log('Sending to QUOTATION_WEBHOOK:', QUOTATION_WEBHOOK);
    const response2 = await fetch(QUOTATION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    console.log('QUOTATION webhook response status:', response2.status);
    
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
});

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
// QUOTATION FORM SUBMISSION
// ============================================== 

quotationForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showResponse('error', 'Not Logged In', 'Please login first to request a quotation.', 'quotation');
    return;
  }
  
  const formData = {
    product_name: document.getElementById('quotation_product_name').value,
    quantity: parseInt(document.getElementById('quotation_quantity').value),
    customer_name: document.getElementById('quotation_customer_name').value,
    business_name: document.getElementById('quotation_business').value || '',
    requirements: document.getElementById('quotation_requirements').value || '',
    customer_email: currentUser.email,
    order_type: 'quotation'
  };
  
  const errors = validateQuotationForm(formData);
  
  if (Object.keys(errors).length > 0) {
    displayValidationErrors(errors, 'quotation');
    showResponse('error', 'Validation Error', 'Please fill in all required fields correctly.', 'quotation');
    return;
  }
  
  document.querySelectorAll('#quotation-tab .form-error').forEach(el => {
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
    
    // Send to n8n webhook
    const response = await fetch(QUOTATION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    
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
});

// ============================================== 
// SMOOTH SCROLL
// ============================================== 

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
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
  checkAuthStatus();
  console.log('✓ AI Order Automation System loaded with Email Authentication');
  console.log('Order Webhook:', ORDER_WEBHOOK);
  console.log('Quotation Webhook:', QUOTATION_WEBHOOK);

  // Populate product select from inline PRODUCTS list
  populateProductSelect(PRODUCTS);
});
