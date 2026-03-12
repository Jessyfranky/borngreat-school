import { Link } from 'react-router-dom';
import '../styles/Home.css';

const stats = [
  { value: '200+', label: 'Pupils Enrolled' },
  { value: '25', label: 'Staff Members' },
  { value: '2019', label: 'Year Founded' },
  { value: '3', label: 'Terms Per Year' },
];

const values = [
  { icon: 'fa-solid fa-graduation-cap', title: 'Academic Excellence', desc: 'Rigorous curriculum designed to challenge and inspire every student to reach their full potential.' },
  { icon: 'fa-solid fa-handshake', title: 'Community Spirit', desc: 'Built on the support of families and the surrounding community from day one.' },
  { icon: 'fa-solid fa-lightbulb', title: 'Innovation', desc: 'Equipping learners with the skills to think creatively and adapt to a changing world.' },
  { icon: 'fa-solid fa-seedling', title: 'Character & Values', desc: 'Nurturing morally sound individuals who will positively impact society.' },
];

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-badge"><i className="fa-solid fa-star"></i> Welcome to Borngreat School</div>
          <h1>Raising Tomorrow's<br /><span className="hero-highlight">Leaders Today</span></h1>
          <p className="hero-sub">
            A vibrant learning community in Uyo, Akwa Ibom State, dedicated to academic
            excellence, innovation, and building confident young minds since 2019.
          </p>
          <div className="hero-actions">
            <Link to="/about" className="btn btn-gold">Discover Our Story</Link>
            <Link to="/login" className="btn btn-outline-white">Access Portal →</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-icon"><i className="fa-solid fa-school"></i></div>
            <p>Uyo, Akwa Ibom</p>
            <p>Nigeria</p>
            <p style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.7 }}>Est. 2019</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stats-container">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* About snippet */}
      <section className="about-snippet">
        <div className="section-container">
          <div className="about-text">
            <div className="section-tag">Our Story</div>
            <h2>Born in Challenge,<br />Built to Last</h2>
            <p>
              Borngreat School was founded in 2019 by <strong>Latifat Isonguyo Asada</strong> with just
              34 pupils and 4 dedicated teachers. Despite launching during the COVID-19 pandemic,
              the school's resilience and commitment to education saw it through and it has never
              looked back.
            </p>
            <p>
              Today, we are a thriving community of approximately 200 pupils and 25 staff — a
              testament to vision, perseverance, and the transformative power of education.
            </p>
            <Link to="/about" className="btn btn-primary">Read Full History</Link>
          </div>
          <div className="about-visual">
            <div className="visual-box">
              <div className="visual-quote">
                "To raise confident, innovative, and morally sound learners who are equipped to
                excel academically and positively impact society."
              </div>
              <div className="visual-attribution">— Our Vision</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values-section">
        <div className="section-container column">
          <div className="section-header">
            <div className="section-tag">What We Stand For</div>
            <h2>Our Core Values</h2>
          </div>
          <div className="values-grid">
            {values.map((v, i) => (
              <div key={i} className="value-card card">
                <div className="value-icon"><i className={v.icon}></i></div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Access Your School Portal</h2>
          <p>Teachers upload results. Students check their academic performance securely from anywhere.</p>
          <Link to="/login" className="btn btn-gold">Login to Portal →</Link>
        </div>
      </section>
    </div>
  );
}