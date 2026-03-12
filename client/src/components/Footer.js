import { Link } from 'react-router-dom';
import '../styles/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img src="/logo.jpeg" alt="Borngreat International Schools" className="footer-logo" />
          <div>
            <h3>Borngreat School</h3>
            <p>Future Secured and Assured</p>
            <div className="footer-social">
              <a href="https://facebook.com/BornGreatKidsSchools" target="_blank" rel="noreferrer" className="social-link">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/"><i className="fa-solid fa-house"></i> Home</Link>
            <Link to="/about"><i className="fa-solid fa-school"></i> About Us</Link>
            <Link to="/gallery"><i className="fa-solid fa-images"></i> Gallery</Link>
            <Link to="/contact"><i className="fa-solid fa-envelope"></i> Contact</Link>
            <Link to="/login"><i className="fa-solid fa-lock"></i> School Portal</Link>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <p><i className="fa-solid fa-location-dot"></i> 19 Calabar Street, Off Nepa Line, Uyo, Akwa Ibom State, Nigeria</p>
            <p><i className="fa-solid fa-phone"></i> 08068466681</p>
            <p><i className="fa-solid fa-phone"></i> 08125003269</p>
            <p><i className="fa-solid fa-envelope"></i> borngreatschool@gmail.com</p>
            <p><i className="fa-brands fa-facebook-f"></i> BornGreat Kids Schools</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Borngreat International Schools. All rights reserved. | Est. 2019</p>
      </div>
    </footer>
  );
}