import { registerUser } from '../../data/api';
import { showNotification } from '../../utils/notification';

export default class RegisterPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <h1>Daftar</h1>
          <form id="register-form" class="auth-form">
            <div class="form-group">
              <label for="name">Nama</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                aria-required="true"
                aria-label="Full name"
              />
              <span class="error-message" id="name-error" role="alert"></span>
            </div>
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
                minlength="8"
                aria-required="true"
                aria-label="Password"
              />
              <span class="error-message" id="password-error" role="alert"></span>
            </div>
            <button type="submit" class="btn-primary">Daftar</button>
          </form>
          <p class="auth-link">
            Sudah punya akun? <a href="#/login">Masuk di sini</a>
          </p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Clear previous errors
      document.getElementById('name-error').textContent = '';
      document.getElementById('email-error').textContent = '';
      document.getElementById('password-error').textContent = '';

      // Validation
      let hasError = false;
      if (!name) {
        document.getElementById('name-error').textContent = 'Nama harus diisi';
        hasError = true;
      }
      if (!email) {
        document.getElementById('email-error').textContent = 'Email harus diisi';
        hasError = true;
      }
      if (!password) {
        document.getElementById('password-error').textContent = 'Password harus diisi';
        hasError = true;
      } else if (password.length < 8) {
        document.getElementById('password-error').textContent = 'Password minimal 8 karakter';
        hasError = true;
      }

      if (hasError) return;

      try {
        const response = await registerUser({ name, email, password });
        
        if (response.error) {
          showNotification(response.message || 'Registrasi gagal', 'error');
          return;
        }

        if (response.user) {
          showNotification('Registrasi berhasil! Silakan login', 'success');
          window.location.hash = '#/login';
        }
      } catch (error) {
        showNotification('Terjadi kesalahan saat registrasi', 'error');
        console.error('Register error:', error);
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

