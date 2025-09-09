const API_BASE = localStorage.getItem('api_base') || 'http://127.0.0.1:8000';

// Show error message
function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

// Show success message
function showSuccess(message) {
  const successEl = document.getElementById('success-message');
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.remove('hidden');
  }
}

// Hide messages
function hideMessages() {
  const errorEl = document.getElementById('error-message');
  const successEl = document.getElementById('success-message');
  if (errorEl) errorEl.classList.add('hidden');
  if (successEl) successEl.classList.add('hidden');
}

// API call helper
async function api(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  return res.status === 204 ? null : res.json();
}

// Handle login form
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    // Use form data for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.set('username', email);
    formData.set('password', password);
    
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });
    
    if (!res.ok) {
      throw new Error('Invalid email or password');
    }
    
    const data = await res.json();
    
    // Store token and redirect
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('email', email);
    
    // Redirect to main app
    window.location.href = 'index.html';
    
  } catch (error) {
    showError(error.message);
  }
});

// Handle register form
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();
  
  const fullName = document.getElementById('full-name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validate passwords match
  if (password !== confirmPassword) {
    showError('Passwords do not match');
    return;
  }
  
  // Validate password length
  if (password.length < 8) {
    showError('Password must be at least 8 characters long');
    return;
  }
  
  try {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName || null
      })
    });
    
    showSuccess('Account created successfully! Redirecting to login...');
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    
  } catch (error) {
    if (error.message.includes('already registered')) {
      showError('An account with this email already exists');
    } else {
      showError('Registration failed. Please try again.');
    }
  }
});

// Check if user is already logged in
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  if (token && window.location.pathname.includes('login.html')) {
    // User is already logged in, redirect to main app
    window.location.href = 'index.html';
  }
});
