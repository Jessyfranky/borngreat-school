import '../styles/Contact.css';

export default function Contact() {
  return (
    <div className="contact-page">
      <section className="page-hero">
        <div className="page-hero-content">
          <div className="section-tag">Get in Touch</div>
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Reach out for admissions, enquiries, or anything at all.</p>
        </div>
      </section>

      <section className="contact-section">
        <div className="contact-container contact-container-full">

          {/* Info Cards */}
          <div className="contact-info">
            <h2>Find Us</h2>

            <div className="info-card card">
              <div className="info-icon"><i className="fa-solid fa-location-dot"></i></div>
              <div>
                <h4>Our Address</h4>
                <p>19 Calabar Street, Off Nepa Line<br />Uyo, Akwa Ibom State, Nigeria</p>
              </div>
            </div>

            <div className="info-card card">
              <div className="info-icon"><i className="fa-solid fa-phone"></i></div>
              <div>
                <h4>Phone Numbers</h4>
                <p>08068466681</p>
                <p>08125003269</p>
              </div>
            </div>

            <div className="info-card card">
              <div className="info-icon"><i className="fa-solid fa-envelope"></i></div>
              <div>
                <h4>Email</h4>
                <p>borngreatschool@gmail.com</p>
              </div>
            </div>

            <div className="info-card card">
              <div className="info-icon"><i className="fa-brands fa-facebook-f"></i></div>
              <div>
                <h4>Facebook</h4>
                <p>BornGreat Kids Schools</p>
              </div>
            </div>

            <div className="info-card card">
              <div className="info-icon"><i className="fa-solid fa-clock"></i></div>
              <div>
                <h4>School Hours</h4>
                <p>Monday – Friday: 7:30am – 3:30pm</p>
                <p>Saturday: Closed</p>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="map-wrapper card">
            <h2>Our Location</h2>
            <p className="map-sub">
              <i className="fa-solid fa-location-dot"></i>
              19 Calabar Street, Off Nepa Line, Uyo, Akwa Ibom, Nigeria
            </p>
            <div className="map-embed">
              <iframe
                title="Borngreat International Schools Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521!2d7.9306!3d5.0500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sUyo%2C+Akwa+Ibom%2C+Nigeria!5e0!3m2!1sen!2sng!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://maps.google.com/?q=Calabar+Street+Uyo+Akwa+Ibom+Nigeria"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary map-directions-btn"
            >
              <i className="fa-solid fa-diamond-turn-right"></i> Get Directions
            </a>
          </div>

        </div>
      </section>
    </div>
  );
}
