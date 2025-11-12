import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { sleep } from '../utils';
import { isAuthenticated, removeAuthToken, removeUser } from '../utils/storage';
import { showNotification } from '../utils/notification';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupNavigation();
    this.#updateNavigation();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  #setupNavigation() {
    // Logout handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        removeAuthToken();
        removeUser();
        showNotification('Anda telah keluar', 'success');
        this.#updateNavigation();
        window.location.hash = '#/';
      });
    }
  }

  #updateNavigation() {
    const isAuth = isAuthenticated();
    const addStoryLink = document.getElementById('add-story-link');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutLink = document.getElementById('logout-link');

    if (addStoryLink) {
      addStoryLink.style.display = isAuth ? '' : 'none';
    }
    if (loginLink) {
      loginLink.style.display = isAuth ? 'none' : '';
    }
    if (registerLink) {
      registerLink.style.display = isAuth ? 'none' : '';
    }
    if (logoutLink) {
      logoutLink.style.display = isAuth ? '' : 'none';
    }
  }

  #manualRender = async (page) => {
    // Custom transition: fade out
    if (this.#currentPage) {
      this.#content.style.opacity = '0';
      this.#content.style.transform = 'translateY(10px)';
      await sleep(200);
    }

    // Render new page
    this.#content.innerHTML = await page.render();
    await page.afterRender();

    // Custom transition: fade in
    this.#content.style.transition = 'opacity 300ms ease, transform 300ms ease';
    this.#content.style.opacity = '1';
    this.#content.style.transform = 'translateY(0)';
  };

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      this.#content.innerHTML = '<h1>404 - Page Not Found</h1>';
      return;
    }

    // Update navigation visibility
    this.#updateNavigation();

    // Use View Transition API if available, otherwise fallback to manual animation
    if (document.startViewTransition) {
      try {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
        }).finished;
      } catch (err) {
        console.warn('ViewTransition gagal, fallback ke animasi manual:', err);
        await this.#manualRender(page);
      }
    } else {
      // Fallback to manual animation
      await this.#manualRender(page);
    }

    this.#currentPage = page;
  }
}

export default App;
