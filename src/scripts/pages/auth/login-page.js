import { loginUser } from '../../data/api';
import { saveAuthToken, saveUser } from '../../utils/storage';
import { showNotification } from '../../utils/notification';

export default class LoginPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <h1>Masuk</h1>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                required 
                aria-required="true"
                aria-label="Email address"
              />
              <span class="error-message" id="email-error" role="alert"></span>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                required 
                aria-required="true"
                aria-label="Password"
              />
              <span class="error-message" id="password-error" role="alert"></span>
            </div>
            <button type="submit" class="btn-primary">Masuk</button>
          </form>
          <p class="auth-link">
            Belum punya akun? <a href="#/register">Daftar di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Clear previous errors
      document.getElementById('email-error').textContent = '';
      document.getElementById('password-error').textContent = '';

      // Validation
      let hasError = false;
      if (!email) {
        document.getElementById('email-error').textContent = 'Email harus diisi';
        hasError = true;
      }
      if (!password) {
        document.getElementById('password-error').textContent = 'Password harus diisi';
        hasError = true;
      }

      if (hasError) return;

      try {
        const response = await loginUser({ email, password });
        
        if (response.error) {
          showNotification(response.message || 'Login gagal', 'error');
          return;
        }

        if (response.loginResult) {
          saveAuthToken(response.loginResult.token);
          saveUser(response.loginResult);
          showNotification('Login berhasil!', 'success');
          window.location.hash = '#/';
        }
      } catch (error) {
        showNotification('Terjadi kesalahan saat login', 'error');
        console.error('Login error:', error);
      }
    });

    // Keyboard navigation support
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        const inputs = Array.from(form.querySelectorAll('input'));
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else {
          form.querySelector('button[type="submit"]').focus();
        }
      }
    });
  }
}

