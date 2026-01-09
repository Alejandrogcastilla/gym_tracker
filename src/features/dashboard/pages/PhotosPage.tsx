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
  const [activeIndex, setActiveIndex] = useState(0);
  const [futureRevealed, setFutureRevealed] = useState(false);

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
        if (received.length > 0) {
          setActiveIndex(received.length - 1);
        }
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

  const currentImage = hasAnyImages ? images[activeIndex] ?? null : null;
  const isFuture = hasAnyImages && activeIndex === images.length - 1;

  const goPrev = () => {
    if (!hasAnyImages) return;
    setActiveIndex((prev) => {
      const next = prev === 0 ? images.length - 1 : prev - 1;
      if (next !== images.length - 1) {
        setFutureRevealed(false);
      }
      return next;
    });
  };

  const goNext = () => {
    if (!hasAnyImages) return;
    setActiveIndex((prev) => {
      const next = prev === images.length - 1 ? 0 : prev + 1;
      if (next !== images.length - 1) {
        setFutureRevealed(false);
      }
      return next;
    });
  };

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
      <section className="dashboard-container photos-page-container">
        <div className="photos-main">
          {loading ? (
            <p className="photos-status">Cargando tus fotos...</p>
          ) : error || !hasAnyImages ? (
            <div className="photos-empty-card">
              <p className="photos-empty-title">No se han encontrado fotos</p>
              <p className="photos-empty-text">Sube una para tener un seguimiento de tu progreso.</p>
            </div>
          ) : (
            <div className="photos-carousel">
              <article className="photos-card">
                <div className="photos-card__header">
                  <button
                    type="button"
                    className="photos-arrow photos-arrow--left"
                    onClick={goPrev}
                    aria-label="Foto anterior"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>

                  <p className="photos-card__label">
                    Foto {activeIndex + 1} de {images.length}
                  </p>

                  <button
                    type="button"
                    className="photos-arrow photos-arrow--right"
                    onClick={goNext}
                    aria-label="Foto siguiente"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
                {currentImage ? (
                  isFuture && !futureRevealed ? (
                    <button
                      type="button"
                      className="photos-card__future-cover"
                      onClick={() => setFutureRevealed(true)}
                    >
                      <span className="photos-card__future-title">Objetivo oculto</span>
                      <span className="photos-card__future-subtitle">Toca para desvelar tu foto objetivo</span>
                    </button>
                  ) : (
                    <img
                      src={toDataUrl(currentImage)}
                      alt={isFuture ? 'Foto de progreso objetivo' : `Foto de progreso ${activeIndex + 1}`}
                      className="photos-card__image"
                    />
                  )
                ) : (
                  <div className="photos-card__placeholder">
                    📷 Aún no hay foto disponible
                  </div>
                )}
              </article>
            </div>
          )}
        </div>

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
