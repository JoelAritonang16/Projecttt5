import { addStory } from '../../data/api';
import { getAuthToken, isAuthenticated } from '../../utils/storage';
import { showNotification } from '../../utils/notification';

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #selectedLat = null;
  #selectedLon = null;
  #cameraStream = null;

  async render() {
    if (!isAuthenticated()) {
      return `
        <section class="container">
          <article class="auth-required">
            <h1>Autentikasi Diperlukan</h1>
            <p>Silakan <a href="#/login">masuk</a> terlebih dahulu untuk menambahkan cerita.</p>
          </article>
        </section>
      `;
    }

    return `
      <section class="container">
        <article class="add-story-section">
          <header>
            <h1>Tambah Cerita Baru</h1>
          </header>
          <form id="add-story-form" class="add-story-form" novalidate>
            <div class="form-group">
              <label for="description">Deskripsi <span class="required">*</span></label>
              <textarea 
                id="description" 
                name="description" 
                rows="4" 
                required 
                aria-required="true"
                aria-label="Deskripsi cerita"
                placeholder="Ceritakan pengalaman Anda..."
              ></textarea>
              <span class="error-message" id="description-error" role="alert"></span>
            </div>

            <div class="form-group">
              <label for="photo">Foto <span class="required">*</span></label>
              <div class="photo-input-group">
                <input 
                  type="file" 
                  id="photo" 
                  name="photo" 
                  accept="image/*" 
                  required 
                  aria-required="true"
                  aria-label="Upload foto"
                />
                <button 
                  type="button" 
                  id="camera-button" 
                  class="btn-secondary"
                  aria-label="Ambil foto dari kamera"
                >
                  📷 Ambil dari Kamera
                </button>
              </div>
              <div id="photo-preview" class="photo-preview" style="display: none;">
                <img id="preview-image" src="" alt="Preview foto" />
                <button type="button" id="remove-preview" class="btn-remove" aria-label="Hapus preview">×</button>
              </div>
              <span class="error-message" id="photo-error" role="alert"></span>
            </div>

            <div class="form-group">
              <label for="location-map">Pilih Lokasi di Peta <span class="required">*</span></label>
              <p class="help-text">Klik pada peta untuk memilih lokasi</p>
              <div id="location-map" class="location-map" role="application" aria-label="Peta untuk memilih lokasi"></div>
              <div id="location-info" class="location-info" style="display: none;">
                <p>Koordinat: <span id="coordinates"></span></p>
              </div>
              <span class="error-message" id="location-error" role="alert"></span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">Tambah Cerita</button>
              <button type="button" class="btn-secondary" onclick="window.location.hash='#/'">Batal</button>
            </div>
          </form>
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

    // Setup form handlers
    this.#setupFormHandlers();

    // Setup camera button
    this.#setupCameraButton();
  }

  async #initMap() {
    const mapContainer = document.getElementById('location-map');
    if (!mapContainer) return;

    // Wait for Leaflet to be available
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded');
      return;
    }

    // Create map
    this.#map = L.map('location-map', {
      center: [-6.2088, 106.8456], // Jakarta
      zoom: 10,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.#map);

    // Add click handler to select location
    this.#map.on('click', (e) => {
      this.#selectLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  #selectLocation(lat, lon) {
    this.#selectedLat = lat;
    this.#selectedLon = lon;

    // Remove existing marker
    if (this.#marker) {
      this.#marker.remove();
    }

    // Add new marker
    this.#marker = L.marker([lat, lon])
      .addTo(this.#map)
      .bindPopup(`Lokasi: ${lat.toFixed(6)}, ${lon.toFixed(6)}`)
      .openPopup();

    // Update location info
    const locationInfo = document.getElementById('location-info');
    const coordinates = document.getElementById('coordinates');
    if (locationInfo && coordinates) {
      coordinates.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      locationInfo.style.display = 'block';
    }

    // Clear location error
    const locationError = document.getElementById('location-error');
    if (locationError) {
      locationError.textContent = '';
    }
  }

  #setupFormHandlers() {
    const form = document.getElementById('add-story-form');
    const photoInput = document.getElementById('photo');
    const previewImage = document.getElementById('preview-image');
    const photoPreview = document.getElementById('photo-preview');
    const removePreview = document.getElementById('remove-preview');

    // Photo preview
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.#showPhotoPreview(file, previewImage, photoPreview);
      }
    });

    // Remove preview
    if (removePreview) {
      removePreview.addEventListener('click', () => {
        photoInput.value = '';
        photoPreview.style.display = 'none';
        const photoError = document.getElementById('photo-error');
        if (photoError) {
          photoError.textContent = '';
        }
      });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.#handleSubmit();
    });
  }

  #showPhotoPreview(file, previewImage, photoPreview) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  async #handleSubmit() {
    const form = document.getElementById('add-story-form');
    const descriptionInput = document.getElementById('description');
    const photoInput = document.getElementById('photo');

    // Clear previous errors
    document.getElementById('description-error').textContent = '';
    document.getElementById('photo-error').textContent = '';
    document.getElementById('location-error').textContent = '';

    // Get values
    const description = descriptionInput.value.trim();
    const photo = photoInput.files[0];

    // Validation
    let hasError = false;

    if (!description) {
      document.getElementById('description-error').textContent = 'Deskripsi harus diisi';
      hasError = true;
    } else if (description.length < 10) {
      document.getElementById('description-error').textContent = 'Deskripsi minimal 10 karakter';
      hasError = true;
    }

    if (!photo) {
      document.getElementById('photo-error').textContent = 'Foto harus diunggah';
      hasError = true;
    } else if (!photo.type.startsWith('image/')) {
      document.getElementById('photo-error').textContent = 'File harus berupa gambar';
      hasError = true;
    } else if (photo.size > 5 * 1024 * 1024) {
      document.getElementById('photo-error').textContent = 'Ukuran file maksimal 5MB';
      hasError = true;
    }

    if (!this.#selectedLat || !this.#selectedLon) {
      document.getElementById('location-error').textContent = 'Silakan pilih lokasi di peta';
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Submit
    try {
      const token = getAuthToken();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Mengirim...';

      const response = await addStory({
        token,
        description,
        photo,
        lat: this.#selectedLat,
        lon: this.#selectedLon,
      });

      if (response.error) {
        showNotification(response.message || 'Gagal menambahkan cerita', 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Tambah Cerita';
        return;
      }

      showNotification('Cerita berhasil ditambahkan!', 'success');
      window.location.hash = '#/';
    } catch (error) {
      showNotification('Terjadi kesalahan saat menambahkan cerita', 'error');
      console.error('Add story error:', error);
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Tambah Cerita';
    }
  }

  #setupCameraButton() {
    const cameraButton = document.getElementById('camera-button');
    const photoInput = document.getElementById('photo');

    if (!cameraButton) return;

    cameraButton.addEventListener('click', async () => {
      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showNotification('Kamera tidak didukung di perangkat ini', 'error');
          return;
        }

        // Stop existing stream if any
        if (this.#cameraStream) {
          this.#stopCamera();
        }

        // Request camera access
        this.#cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Use back camera if available
        });

        // Show camera preview
        this.#showCameraPreview();
      } catch (error) {
        console.error('Camera error:', error);
        if (error.name === 'NotAllowedError') {
          showNotification('Akses kamera ditolak. Silakan izinkan akses kamera.', 'error');
        } else if (error.name === 'NotFoundError') {
          showNotification('Kamera tidak ditemukan', 'error');
        } else {
          showNotification('Gagal mengakses kamera', 'error');
        }
      }
    });
  }

  #showCameraPreview() {
    // Create camera preview modal
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-modal-content">
        <div class="camera-preview-container">
          <video id="camera-preview" autoplay playsinline></video>
        </div>
        <div class="camera-controls">
          <button type="button" id="capture-button" class="btn-primary" aria-label="Ambil foto">📷 Ambil Foto</button>
          <button type="button" id="cancel-camera-button" class="btn-secondary" aria-label="Batal">Batal</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const video = document.getElementById('camera-preview');
    const captureButton = document.getElementById('capture-button');
    const cancelButton = document.getElementById('cancel-camera-button');

    // Set video source
    video.srcObject = this.#cameraStream;

    // Capture photo
    captureButton.addEventListener('click', () => {
      this.#capturePhoto(video, modal);
    });

    // Cancel
    cancelButton.addEventListener('click', () => {
      this.#stopCamera();
      modal.remove();
    });

    // Close on escape key
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        this.#stopCamera();
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      }
    }.bind(this));
  }

  #capturePhoto(video, modal) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create file from blob
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        // Set to input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const photoInput = document.getElementById('photo');
        photoInput.files = dataTransfer.files;

        // Trigger change event
        photoInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Stop camera and close modal
        this.#stopCamera();
        modal.remove();

        showNotification('Foto berhasil diambil', 'success');
      }
    }, 'image/jpeg', 0.9);
  }

  #stopCamera() {
    if (this.#cameraStream) {
      this.#cameraStream.getTracks().forEach((track) => track.stop());
      this.#cameraStream = null;
    }
  }
}

