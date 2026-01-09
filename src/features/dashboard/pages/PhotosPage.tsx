import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { UserProfile } from '@/types/user';
import { getUserProfileById, upsertUserProfile } from '@/features/users/services/userRepository';
import './DashboardHomePage.css';

function toDataUrl(image: string): string {
  if (!image) return '';
  return image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
}

export function PhotosPage() {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const [images, setImages] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [futureRevealed, setFutureRevealed] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentSubmitting, setConsentSubmitting] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatingFuture, setGeneratingFuture] = useState(false);
  const [pendingGenerateAfterConsent, setPendingGenerateAfterConsent] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const profile = await getUserProfileById(user.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error(err);
        setProfileError('No se ha podido cargar tu perfil.');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!apiBaseUrl) {
          throw new Error('VITE_API_BASE_URL no está configurada');
        }

        const response = await fetch(`${apiBaseUrl}/get_user_images/${user.uid}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('No se han podido cargar tus fotos.');
        }

        const data = await response.json();
        console.log('get_user_images response', data);

        const oldest = (data as any)?.oldest ?? '';
        const newest = (data as any)?.newest ?? '';
        const futuro = (data as any)?.futuro ?? '';

        const oldestName = (data as any)?.oldest_name ?? '';
        const newestName = (data as any)?.newest_name ?? '';
        const futuroName = (data as any)?.futuro_name ?? '';

        const received: string[] = [
          typeof oldest === 'string' ? oldest : '',
          typeof newest === 'string' ? newest : '',
          typeof futuro === 'string' ? futuro : '',
        ];

        const receivedNames: string[] = [
          typeof oldestName === 'string' ? oldestName : '',
          typeof newestName === 'string' ? newestName : '',
          typeof futuroName === 'string' ? futuroName : '',
        ];

        setImages(received);
        setImageNames(receivedNames);
        if (received.length > 0) {
          const lastNonEmptyIndex = received.reduce(
            (acc, img, idx) => (img ? idx : acc),
            -1,
          );
          setActiveIndex(lastNonEmptyIndex >= 0 ? lastNonEmptyIndex : 0);
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
  const hasAcceptedAi = !!userProfile?.accept_ai;

  const rawCurrentImage = hasAnyImages ? images[activeIndex] ?? '' : '';
  const hasImageAtSlot = !!rawCurrentImage;
  const currentImage = hasImageAtSlot ? rawCurrentImage : null;
  const isFuture = hasAnyImages && activeIndex === images.length - 1;
  const slotLabel = activeIndex === 0 ? 'Inicio' : activeIndex === 1 ? 'Presente' : 'Futuro';

  const goPrev = () => {
    if (!hasAnyImages) return;
    setActiveIndex((prev) => {
      const next = prev === 0 ? images.length - 1 : prev - 1;
      if (next !== images.length - 1) {
        setFutureRevealed(false);
      }
      setCardFlipped(false);
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
      setCardFlipped(false);
      return next;
    });
  };

  const handleFutureClick = () => {
    if (hasAcceptedAi) {
      setFutureRevealed(true);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleDeleteCurrentImage = async () => {
    if (!user) {
      setUploadError('Debes iniciar sesión para eliminar una foto.');
      return;
    }

    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL no está configurada');
      setUploadError('No se ha podido eliminar la foto. Inténtalo más tarde.');
      return;
    }

    if (!hasAnyImages || !currentImage || deletingImage) return;

    const imageName = imageNames[activeIndex];
    if (!imageName) {
      console.error('No hay nombre de recurso para la imagen actual');
      setUploadError('No se ha podido eliminar la foto. Inténtalo más tarde.');
      return;
    }

    try {
      setDeletingImage(true);
      setUploadError(null);

      const response = await fetch(
        `${apiBaseUrl}/borrar_imagen/${encodeURIComponent(user.uid)}/${encodeURIComponent(imageName)}`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        console.error('Error al eliminar la imagen', response.status, response.statusText);
        setUploadError('No se ha podido eliminar la foto. Inténtalo de nuevo.');
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error('Error de red al eliminar la imagen', err);
      setUploadError('No se ha podido eliminar la foto. Inténtalo de nuevo.');
    } finally {
      setDeletingImage(false);
    }
  };

  const generateFutureImage = async () => {
    if (!user) {
      setUploadError('Debes iniciar sesión para generar tu foto objetivo.');
      return;
    }

    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL no está configurada');
      setUploadError('No se ha podido generar tu foto objetivo. Inténtalo más tarde.');
      return;
    }

    if (!userProfile) {
      console.error('No hay perfil de usuario cargado para generar el futuro');
      setUploadError('No se ha podido generar tu foto objetivo. Inténtalo más tarde.');
      return;
    }

    if (generatingFuture) return;

    try {
      setGeneratingFuture(true);
      setUploadError(null);

      const payload = {
        goal: userProfile.goal,
        gender: userProfile.gender,
        weightGoalKg: userProfile.weightGoalKg ?? userProfile.weightKg ?? 0,
      };

      const response = await fetch(
        `${apiBaseUrl}/create_user_future/${encodeURIComponent(user.uid)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        console.error('Error al generar la foto objetivo', response.status, response.statusText);
        setUploadError('No se ha podido generar tu foto objetivo. Inténtalo de nuevo.');
        return;
      }

      // Éxito: recargamos para que se actualice la imagen de futuro
      window.location.reload();
    } catch (err) {
      console.error('Error de red al generar la foto objetivo', err);
      setUploadError('No se ha podido generar tu foto objetivo. Inténtalo de nuevo.');
    } finally {
      setGeneratingFuture(false);
      setPendingGenerateAfterConsent(false);
    }
  };

  const handleGenerateFutureClick = () => {
    if (!hasAcceptedAi) {
      setPendingGenerateAfterConsent(true);
      setShowConsentModal(true);
      return;
    }

    void generateFutureImage();
  };

  const handleOpenUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setShowUploadModal(true);
  };

  const handleConfirmUpload = () => {
    if (!uploadFile) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string | null;
      if (!result) {
        console.error('No se ha podido leer la imagen para subirla');
        setUploading(false);
        setUploadError('Algo ha salido mal al subir la foto. Inténtalo de nuevo.');
        return;
      }

      if (!user) {
        console.error('No hay usuario autenticado para subir la foto');
        setUploading(false);
        setUploadError('Debes iniciar sesión para subir una foto.');
        return;
      }

      if (!apiBaseUrl) {
        console.error('VITE_API_BASE_URL no está configurada');
        setUploading(false);
        setUploadError('No se ha podido subir la foto. Inténtalo de nuevo más tarde.');
        return;
      }

      try {
        const base64Image = result.includes(',') ? result.split(',')[1] : result;

        const uploadIsFuture = isFuture && !currentImage;

        const endpoint = uploadIsFuture
          ? `${apiBaseUrl}/create_user_future/${encodeURIComponent(user.uid)}`
          : `${apiBaseUrl}/upload_user_image`;

        const body = uploadIsFuture
          ? JSON.stringify({ image: base64Image })
          : JSON.stringify({ image: base64Image, id_usuario: user.uid });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        if (!response.ok) {
          console.error('Error al subir la imagen', response.status, response.statusText);
          setUploadError('Algo ha salido mal al subir la foto. Inténtalo de nuevo.');
          return;
        }

        // Éxito: cerramos el modal y recargamos la página para refrescar las fotos
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadPreview(null);
        window.location.reload();
      } catch (err) {
        console.error('Error de red al subir la imagen', err);
        setUploadError('Algo ha salido mal al subir la foto. Inténtalo de nuevo.');
      } finally {
        setUploading(false);
      }
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
            <>
              <div className="photos-empty-card">
                <p className="photos-empty-title">No se han encontrado fotos</p>
                <p className="photos-empty-text">Sube una para tener un seguimiento de tu progreso.</p>
              </div>
              <button
                type="button"
                className="photos-upload-button"
                onClick={handleOpenUpload}
              >
                Añadir foto de hoy
              </button>
            </>
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
                    {slotLabel}
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
                  isFuture && !futureRevealed && !hasAcceptedAi ? (
                    <button
                      type="button"
                      className="photos-card__future-cover"
                      onClick={handleFutureClick}
                    >
                      <span className="photos-card__future-title">Objetivo oculto</span>
                      <span className="photos-card__future-subtitle">Toca para desvelar tu foto objetivo</span>
                    </button>
                  ) : (
                    <div
                      className="photos-card__flip-container"
                      onClick={() => setCardFlipped((prev) => !prev)}
                    >
                      <div
                        className={
                          'photos-card__flip-inner' +
                          (cardFlipped ? ' photos-card__flip-inner--flipped' : '')
                        }
                      >
                        <div className="photos-card__face photos-card__face--front">
                          <img
                            src={toDataUrl(currentImage)}
                            alt={
                              isFuture
                                ? 'Foto de progreso objetivo'
                                : `Foto de progreso ${activeIndex + 1}`
                            }
                            className="photos-card__image"
                          />
                        </div>
                        <div className="photos-card__face photos-card__face--back">
                          <p className="photos-card__delete-text">
                            ¿Quieres eliminar esta foto de tu progreso?
                          </p>
                          <button
                            type="button"
                            className="photos-card__delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteCurrentImage();
                            }}
                            disabled={deletingImage}
                          >
                            {deletingImage ? 'Eliminando...' : 'Eliminar foto'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : activeIndex === 0 || activeIndex === 1 ? (
                  <div className="photos-card__placeholder">
                    Empieza por subir una foto
                  </div>
                ) : (
                  <div className="photos-card__placeholder">
                    Aquí verás tu foto objetivo generada con IA cuando esté disponible.
                  </div>
                )}

                <button
                  type="button"
                  className="photos-upload-button photos-upload-button--overlay"
                  onClick={handleOpenUpload}
                  disabled={uploading}
                >
                  {isFuture && !currentImage
                    ? 'Sube una foto'
                    : 'Añadir foto de hoy'}
                </button>
              </article>
            </div>
          )}
        </div>
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

      {uploadError && (
        <div
          className="dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Error al subir la foto"
        >
          <div className="dashboard-modal">
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label="Cerrar"
              onClick={() => setUploadError(null)}
            >
              ×
            </button>
            <div className="dashboard-modal__body photos-upload-modal">
              <h2 className="photos-upload-title">Ha ocurrido un problema</h2>
              <p className="photos-upload-text">{uploadError}</p>
              <div className="photos-upload-actions">
                <button
                  type="button"
                  className="photos-upload-confirm"
                  onClick={() => setUploadError(null)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConsentModal && (
        <div
          className="dashboard-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Consentimiento para generar imagen objetivo"
        >
          <div className="dashboard-modal">
            <button
              type="button"
              className="dashboard-modal__close"
              aria-label="Cerrar"
              onClick={() => {
                if (!consentSubmitting) {
                  setShowConsentModal(false);
                  setConsentError(null);
                  setPendingGenerateAfterConsent(false);
                }
              }}
            >
              ×
            </button>
            <div className="dashboard-modal__body photos-upload-modal">
              <h2 className="photos-upload-title">Objetivo oculto</h2>
              <p className="photos-upload-text">
                Vamos a generar una foto que te ayude a motivarte con tu posible cambio físico.
                Para ello necesitamos tu consentimiento explícito.
              </p>
              <p className="photos-upload-text">
                "Acepto generar una imagen mía alcanzando mi cambio físico".
              </p>

              {consentError && (
                <p className="photos-status photos-status--error">{consentError}</p>
              )}

              <div className="photos-upload-actions">
                <button
                  type="button"
                  className="photos-upload-cancel"
                  onClick={() => {
                    if (!consentSubmitting) {
                      setShowConsentModal(false);
                      setConsentError(null);
                      setPendingGenerateAfterConsent(false);
                    }
                  }}
                  disabled={consentSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="photos-upload-confirm"
                  onClick={async () => {
                    if (!user || consentSubmitting) return;
                    try {
                      setConsentSubmitting(true);
                      setConsentError(null);
                      await upsertUserProfile({ id: user.uid, accept_ai: true });
                      setUserProfile((prev) => (prev ? { ...prev, accept_ai: true } : prev));
                      setShowConsentModal(false);

                      if (pendingGenerateAfterConsent) {
                        await generateFutureImage();
                      } else {
                        setFutureRevealed(true);
                      }
                    } catch (err) {
                      console.error(err);
                      setConsentError('No se ha podido guardar tu consentimiento. Inténtalo más tarde.');
                    } finally {
                      setConsentSubmitting(false);
                    }
                  }}
                  disabled={consentSubmitting}
                >
                  {consentSubmitting ? 'Guardando...' : 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
