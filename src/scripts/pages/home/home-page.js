import { getStories } from '../../data/api';
import { getAuthToken, isAuthenticated } from '../../utils/storage';
import { showNotification } from '../../utils/notification';
import { showFormattedDate } from '../../utils';

export default class HomePage {
  #map = null;
  #markers = [];
  #stories = [];
  #selectedStoryId = null;

  async render() {
    if (!isAuthenticated()) {
      return `
        <section class="container">
          <article class="welcome-section">
            <h1>Selamat Datang di Story App</h1>
            <p>Silakan <a href="#/login">masuk</a> atau <a href="#/register">daftar</a> untuk melihat cerita.</p>
          </article>
        </section>
      `;
    }

    return `
      <section class="container">
        <article class="stories-section">
          <header>
            <h1>Daftar Cerita</h1>
            <div class="map-controls">
              <label for="story-filter" class="sr-only">Filter cerita</label>
              <select id="story-filter" aria-label="Filter cerita berdasarkan nama">
                <option value="">Semua Cerita</option>
              </select>
            </div>
          </header>
          <div class="stories-container">
            <div class="stories-list" id="stories-list" role="list">
              <p class="loading-text">Memuat cerita...</p>
            </div>
            <div class="map-container">
              <div id="map" role="application" aria-label="Peta lokasi cerita"></div>
            </div>
          </div>
        </article>
      </section>
    `;
  }

  async afterRender() {
    if (!isAuthenticated()) {
      return;
    }

    // Initialize map
    await this.#initMap();

    // Load stories
    await this.#loadStories();

    // Setup filter
    this.#setupFilter();
  }

  async #initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Wait for Leaflet to be available
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    // Create map with default tile layer
    this.#map = L.map('map', {
      center: [-6.2088, 106.8456], // Jakarta
      zoom: 10,
      zoomControl: true,
    });

    // Add multiple tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    });

    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    });

    // Add default layer
    osmLayer.addTo(this.#map);

    // Add layer control
    const baseMaps = {
      'OpenStreetMap': osmLayer,
      'Carto Light': cartoLayer,
      'Carto Dark': darkLayer,
    };

    L.control.layers(baseMaps).addTo(this.#map);
  }

  async #loadStories() {
    try {
      const token = getAuthToken();
      const response = await getStories(token);

      if (response.error) {
        showNotification(response.message || 'Gagal memuat cerita', 'error');
        return;
      }

      this.#stories = response.listStory || [];
      this.#renderStoriesList();
      this.#renderMapMarkers();
      this.#updateFilterOptions();
    } catch (error) {
      showNotification('Terjadi kesalahan saat memuat cerita', 'error');
      console.error('Load stories error:', error);
    }
  }

  #renderStoriesList() {
    const listContainer = document.getElementById('stories-list');
    if (!listContainer) return;

    if (this.#stories.length === 0) {
      listContainer.innerHTML = '<p class="empty-text">Belum ada cerita. <a href="#/add-story">Tambahkan cerita pertama Anda!</a></p>';
      return;
    }

    listContainer.innerHTML = this.#stories.map((story) => `
      <article 
        class="story-card ${this.#selectedStoryId === story.id ? 'active' : ''}" 
        data-story-id="${story.id}"
        role="listitem"
        tabindex="0"
        aria-label="Cerita oleh ${story.name}"
      >
        <img 
          src="${story.photoUrl}" 
          alt="${story.description || 'Foto cerita'}" 
          class="story-image"
          loading="lazy"
        />
        <div class="story-content">
          <h2 class="story-name">${story.name}</h2>
          <p class="story-description">${story.description || 'Tidak ada deskripsi'}</p>
          <time class="story-date" datetime="${story.createdAt}">
            ${showFormattedDate(story.createdAt, 'id-ID')}
          </time>
        </div>
      </article>
    `).join('');

    // Add click handlers for synchronization
    listContainer.querySelectorAll('.story-card').forEach((card) => {
      card.addEventListener('click', () => {
        const storyId = card.dataset.storyId;
        this.#highlightStory(storyId);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const storyId = card.dataset.storyId;
          this.#highlightStory(storyId);
        }
      });
    });
  }

  #renderMapMarkers() {
    // Clear existing markers
    this.#markers.forEach((marker) => marker.remove());
    this.#markers = [];

    if (!this.#map) return;

    this.#stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon])
          .addTo(this.#map)
          .bindPopup(`
            <div class="popup-content">
              <img src="${story.photoUrl}" alt="${story.description || 'Foto cerita'}" class="popup-image" />
              <h3>${story.name}</h3>
              <p>${story.description || 'Tidak ada deskripsi'}</p>
              <time datetime="${story.createdAt}">${showFormattedDate(story.createdAt, 'id-ID')}</time>
            </div>
          `);

        marker.on('click', () => {
          this.#highlightStory(story.id);
        });

        this.#markers.push(marker);
      }
    });

    // Fit map to show all markers
    if (this.#markers.length > 0) {
      const group = new L.featureGroup(this.#markers);
      const bounds = group.getBounds();
      this.#map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  #highlightStory(storyId) {
    this.#selectedStoryId = storyId;
    const story = this.#stories.find((s) => s.id === storyId);

    // Update list highlight
    document.querySelectorAll('.story-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.storyId === storyId);
    });

    // Highlight marker on map
    this.#markers.forEach((marker) => {
      const markerStoryId = this.#stories.find((s) => 
        s.lat === marker.getLatLng().lat && s.lon === marker.getLatLng().lng
      )?.id;

      if (markerStoryId === storyId) {
        marker.openPopup();
        this.#map.setView(marker.getLatLng(), this.#map.getZoom(), {
          animate: true,
        });
      }
    });

    // Scroll to card
    const card = document.querySelector(`[data-story-id="${storyId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  #setupFilter() {
    const filterSelect = document.getElementById('story-filter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
      const filterValue = e.target.value;
      this.#filterStories(filterValue);
    });
  }

  #updateFilterOptions() {
    const filterSelect = document.getElementById('story-filter');
    if (!filterSelect) return;

    // Get unique names
    const names = [...new Set(this.#stories.map((s) => s.name))];
    
    // Clear existing options except "Semua Cerita"
    filterSelect.innerHTML = '<option value="">Semua Cerita</option>';
    
    names.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      filterSelect.appendChild(option);
    });
  }

  #filterStories(filterValue) {
    const filteredStories = filterValue 
      ? this.#stories.filter((s) => s.name === filterValue)
      : this.#stories;

    // Update list
    document.querySelectorAll('.story-card').forEach((card) => {
      const storyId = card.dataset.storyId;
      const story = this.#stories.find((s) => s.id === storyId);
      card.style.display = filteredStories.includes(story) ? '' : 'none';
    });

    // Update markers
    this.#markers.forEach((marker) => {
      const markerStory = this.#stories.find((s) => 
        s.lat === marker.getLatLng().lat && s.lon === marker.getLatLng().lng
      );
      
      if (markerStory) {
        marker.setOpacity(filteredStories.includes(markerStory) ? 1 : 0.3);
      }
    });
  }
}
