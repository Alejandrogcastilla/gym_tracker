import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import './DashboardHomePage.css';

function toDataUrl(image: string): string {
  if (!image) return '';
  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
}

export function PhotosPage() {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMoment, setActiveMoment] = useState<'before' | 'now' | 'future'>('now');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/three_images', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('No se han podido cargar tus fotos.');
        }

        const data = await response.json();
        console.log('list_user_images response', data);

        const received: string[] = Array.isArray((data as any)?.images)
          ? (data as any).images
          : Array.isArray(data)
            ? (data as string[])
            : [];

        setImages(received);
      } catch (err) {
        console.error(err);
        setError('No se han podido cargar tus fotos. Inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [user]);

  if (!user) {
    return null;
  }

  const hasAnyImages = images.length > 0;

  const beforeImage = images[0] ?? null;
  const nowImage = hasAnyImages ? images[images.length - 1] : null;
  const futureImage = images.length >= 3 ? images[2] : nowImage;

  const currentImage =
    activeMoment === 'before'
      ? beforeImage
      : activeMoment === 'now'
        ? nowImage
        : futureImage;

  const handleOpenUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setShowUploadModal(true);
  };

  const handleConfirmUpload = () => {
    if (!uploadFile) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (!result) {
        console.error('No se ha podido leer la imagen para subirla');
        setUploading(false);
        return;
      }

      console.log('Subir foto de progreso', {
        user_id: user.uid,
        image: result,
        fileName: uploadFile.name,
      });

      setImages((prev) => [...prev, result]);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploading(false);
    };
    reader.readAsDataURL(uploadFile);
  };

  return (
    <main className="dashboard-page">
      <nav
        className="app-top-nav"
        aria-label="Navegación de momentos de foto"
      >
        <button
          type="button"
          onClick={() => setActiveMoment('before')}
          className={`app-top-nav__item${
            activeMoment === 'before' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">history</span>
          <span>Antes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMoment('now')}
          className={`app-top-nav__item${
            activeMoment === 'now' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">today</span>
          <span>Ahora</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMoment('future')}
          className={`app-top-nav__item${
            activeMoment === 'future' ? ' app-top-nav__item--active' : ''
          }`}
        >
          <span className="material-symbols-outlined">flag</span>
          <span>Objetivo</span>
        </button>
      </nav>

      <section className="dashboard-container">
        {loading ? (
          <p className="photos-status">Cargando tus fotos...</p>
        ) : error ? (
          <p className="photos-status photos-status--error">{error}</p>
        ) : !hasAnyImages ? (
          <div className="photos-empty-card">
            <p className="photos-empty-title">Aún no tienes ninguna imagen</p>
            <p className="photos-empty-text">Añade tu primera foto para empezar a ver tu progreso.</p>
          </div>
        ) : (
          <div className="photos-carousel">
            <article className="photos-card">
              <p className="photos-card__label">
                {activeMoment === 'before' && 'Tu punto de partida'}
                {activeMoment === 'now' && 'Cómo estás hoy'}
                {activeMoment === 'future' && 'Hacia dónde vas'}
              </p>
              {currentImage ? (
                <img
                  src={toDataUrl(currentImage)}
                  alt={
                    activeMoment === 'before'
                      ? 'Foto de progreso inicial'
                      : activeMoment === 'now'
                        ? 'Foto de progreso actual'
                        : 'Foto de progreso objetivo'
                  }
                  className="photos-card__image"
                />
              ) : (
                <div className="photos-card__placeholder">
                  📷 Aún no hay foto para este momento
                </div>
              )}
            </article>
          </div>
        )}

        <button
          type="button"
          className="photos-upload-button"
          onClick={handleOpenUpload}
        >
          Añadir foto de hoy
        </button>
      </section>

      {showUploadModal && (
        <div
          className="dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Subir foto de progreso"
        >
          <div className="dashboard-modal">
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label="Cerrar"
              onClick={() => setShowUploadModal(false)}
            >
              ×
            </button>
            <div className="dashboard-modal__body photos-upload-modal">
              <h2 className="photos-upload-title">Subir foto</h2>
              <p className="photos-upload-text">
                Elige una foto reciente para actualizar tu progreso visual.
              </p>

              <input
                id="photos-file-input"
                type="file"
                accept="image/*"
                className="photos-upload-input"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setUploadFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUploadPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setUploadPreview(null);
                  }
                }}
              />

              <label htmlFor="photos-file-input" className="photos-upload-select">
                <span className="material-symbols-outlined">photo_camera</span>
                <span>Seleccionar foto</span>
              </label>

              {uploadPreview && (
                <img
                  src={uploadPreview}
                  alt="Vista previa de la foto a subir"
                  className="photos-upload-preview"
                />
              )}

              <div className="photos-upload-actions">
                <button
                  type="button"
                  className="photos-upload-cancel"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="photos-upload-confirm"
                  onClick={handleConfirmUpload}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? 'Subiendo...' : 'Confirmar subida'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
