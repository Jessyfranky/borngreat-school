import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/PageTransition.css';

export default function PageTransition({ children }) {
  const location = useLocation();
  const pageRef = useRef(null);

  useEffect(() => {
    // Scroll to top on every navigation
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Trigger animation on route change
    const el = pageRef.current;
    if (!el) return;
    el.classList.remove('page-enter');
    void el.offsetWidth; // force reflow
    el.classList.add('page-enter');
  }, [location.pathname]);

  return (
    <div className="page-transition" ref={pageRef}>
      {children}
    </div>
  );
}