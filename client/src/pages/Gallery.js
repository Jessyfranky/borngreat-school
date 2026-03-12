import { useState, useEffect, useCallback } from 'react';
import '../styles/Gallery.css';

// ── Add your photos here — replace src: null with src: '/gallery/your-image.jpg'
const PHOTOS = [
  { src: '/gallery/pic1.jpeg', caption: 'Borngreat International Schools', color: '#1a6b3c' },
  { src: '/gallery/pic2.jpeg', caption: 'Borngreat International Schools', color: '#2d5a8e' },
  { src: '/gallery/pic4.jpeg', caption: 'Borngreat International Schools', color: '#8b4513' },
  { src: '/gallery/pic5.jpeg', caption: 'Borngreat International Schools', color: '#4a1a6b' },
  { src: '/gallery/pic6.jpeg', caption: 'Borngreat International Schools', color: '#6b3a1a' },
  { src: '/gallery/pic7.jpeg', caption: 'Borngreat International Schools', color: '#1a4a6b' },
  { src: '/gallery/pic8.jpeg', caption: 'Borngreat International Schools', color: '#3a6b1a' },
  { src: '/gallery/pic9.jpeg', caption: 'Borngreat International Schools', color: '#6b5a1a' },
  { src: '/gallery/pic10.jpeg', caption: 'Borngreat International Schools', color: '#2a1a6b' },
  { src: '/gallery/pic11.jpeg', caption: 'Borngreat International Schools', color: '#2a1a6b' },
];

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => goTo('next'), 5000);
    return () => clearInterval(timer);
  }, [carouselIndex]);

  const goTo = useCallback((dir) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCarouselIndex(prev => {
        if (dir === 'next') return (prev + 1) % PHOTOS.length;
        return (prev - 1 + PHOTOS.length) % PHOTOS.length;
      });
      setAnimating(false);
    }, 400);
  }, [animating]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % PHOTOS.length);
      if (e.key === 'ArrowLeft')  setLightboxIndex(i => (i - 1 + PHOTOS.length) % PHOTOS.length);
      if (e.key === 'Escape')     setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex]);

  const current = PHOTOS[carouselIndex];
  const prev    = PHOTOS[(carouselIndex - 1 + PHOTOS.length) % PHOTOS.length];
  const next    = PHOTOS[(carouselIndex + 1) % PHOTOS.length];

  return (
    <div className="gallery-page">
      {/* Hero */}
      <div className="gallery-hero">
        <div className="gallery-hero-content">
          <div className="gallery-badge"><i className="fa-solid fa-images"></i> Photo Gallery</div>
          <h1>Life at Borngreat</h1>
          <p>Moments of learning, laughter, and achievement — captured for eternity.</p>
        </div>
        <div className="gallery-hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white"/></svg>
        </div>
      </div>

      <div className="gallery-body">
        {/* Main Carousel */}
        <div className="carousel-wrapper">
          {/* Prev side */}
          <div className="carousel-side prev-preview" onClick={() => goTo('prev')}>
            <PhotoSlide photo={prev} isPreview />
            <div className="side-overlay"><i className="fa-solid fa-chevron-left"></i></div>
          </div>

          {/* Main slide */}
          <div className="carousel-main">
            <div className={`carousel-slide ${animating ? `exit-${direction}` : 'enter'}`}>
              <PhotoSlide
                photo={current}
                onClick={() => setLightboxIndex(carouselIndex)}
                isMain
              />
            </div>
            <div className="carousel-counter">
              {carouselIndex + 1} / {PHOTOS.length}
            </div>
          </div>

          {/* Next side */}
          <div className="carousel-side next-preview" onClick={() => goTo('next')}>
            <PhotoSlide photo={next} isPreview />
            <div className="side-overlay"><i className="fa-solid fa-chevron-right"></i></div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="carousel-dots">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === carouselIndex ? 'active' : ''}`}
              onClick={() => { setDirection(i > carouselIndex ? 'next' : 'prev'); setCarouselIndex(i); }}
            />
          ))}
        </div>

        {/* Thumbnail Strip */}
        <div className="thumbnail-strip">
          {PHOTOS.map((photo, i) => (
            <div
              key={i}
              className={`thumbnail ${i === carouselIndex ? 'active' : ''}`}
              onClick={() => { setDirection(i > carouselIndex ? 'next' : 'prev'); setCarouselIndex(i); }}
            >
              <PhotoSlide photo={photo} isThumb />
              {i === carouselIndex && <div className="thumb-active-bar" />}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <button className="lightbox-nav prev" onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + PHOTOS.length) % PHOTOS.length); }}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <PhotoSlide photo={PHOTOS[lightboxIndex]} isLightbox />
            <div className="lightbox-caption">
              <p>{lightboxIndex + 1} of {PHOTOS.length}</p>
            </div>
          </div>
          <button className="lightbox-nav next" onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % PHOTOS.length); }}>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Photo Slide Component ──
function PhotoSlide({ photo, onClick, isMain, isPreview, isThumb, isLightbox }) {
  if (!photo) return null;

  if (photo.src) {
    return (
      <div className={`photo-frame ${isMain ? 'main' : ''} ${isPreview ? 'preview' : ''} ${isThumb ? 'thumb' : ''} ${isLightbox ? 'lightbox-img' : ''}`}
        onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <img src={photo.src} alt={photo.caption} />
      </div>
    );
  }

  return (
    <div className={`photo-placeholder ${isMain ? 'main' : ''} ${isPreview ? 'preview' : ''} ${isThumb ? 'thumb' : ''} ${isLightbox ? 'lightbox-img' : ''}`}
      style={{ background: `linear-gradient(135deg, ${photo.color}dd, ${photo.color}88)` }}
      onClick={onClick}>
      <div className="placeholder-inner">
        <div className="placeholder-icon"><i className="fa-solid fa-camera"></i></div>
        {(isMain || isLightbox) && <p className="placeholder-label">Borngreat International Schools</p>}
      </div>
    </div>
  );
}
