import '../styles/About.css';

const milestones = [
  { year: '2019', title: 'The Beginning', desc: 'Borngreat School was established by Latifat Isonguyo Asada at 20 Iboko Street, Off Abak Road, Uyo. Started with 34 pupils and 4 dedicated teachers.' },
  { year: '2020', title: 'COVID-19 Challenge', desc: 'After just one term of operation, the nationwide COVID-19 lockdown temporarily halted activities. The school stood firm in its vision despite the disruption.' },
  { year: '2021', title: 'Resilient Return', desc: 'Operations resumed with renewed commitment. The pandemic experience strengthened the school\'s resolve and adaptability.' },
  { year: 'Today', title: 'Growing Strong', desc: 'Now located at 19 Calabar Street, Off Nepa Line, Uyo, with ~200 pupils and 25 staff. Attracting investors and giving back to the community.' },
];

export default function About() {
  return (
    <div className="about-page">
      {/* Page Hero */}
      <section className="page-hero">
        <div className="page-hero-content">
          <div className="section-tag">Est. 2019 · Uyo, Akwa Ibom</div>
          <h1>About Borngreat School</h1>
          <p>A story of vision, courage, and the transformative power of education.</p>
        </div>
      </section>

      {/* Founder */}
      <section className="founder-section">
        <div className="founder-container">
          <div className="founder-visual">
            <div className="founder-emblem">
              <span>LIA</span>
              <div className="founder-title">Founder & CEO</div>
            </div>
          </div>
          <div className="founder-text">
            <div className="section-tag">Our Founder</div>
            <h2>Latifat Isonguyo Asada</h2>
            <p>
              Founder, Chief Executive Officer, and Head of School — Latifat Isonguyo Asada
              established Borngreat School with a clear vision: to create a learning environment
              where every child could thrive, regardless of the circumstances around them.
            </p>
            <p>
              Her leadership through the school's most difficult period — the COVID-19 pandemic —
              demonstrated the very resilience and perseverance she instills in her students.
            </p>
          </div>
        </div>
      </section>

      {/* History / Timeline */}
      <section className="history-section">
        <div className="history-container">
          <div className="section-header centered">
            <div className="section-tag">Our Journey</div>
            <h2>A Timeline of Growth</h2>
          </div>
          <div className="timeline">
            {milestones.map((m, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-year">{m.year}</div>
                <div className="timeline-dot"></div>
                <div className="timeline-content card">
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
            <div className="timeline-line"></div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="vision-section">
        <div className="vision-container">
          <div className="vision-card">
            <div className="vision-icon">🌟</div>
            <h3>Our Vision</h3>
            <p>
              To raise confident, innovative, and morally sound learners who are equipped
              to excel academically and positively impact society.
            </p>
          </div>
          <div className="vision-card">
            <div className="vision-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>
              To provide a safe, inclusive, and stimulating learning environment that
              equips every child with knowledge, skills, and values for lifelong success.
            </p>
          </div>
          <div className="vision-card">
            <div className="vision-icon">❤️</div>
            <h3>Community First</h3>
            <p>
              From the beginning, Borngreat School has been supported by its community,
              and in turn gives back through service projects and meaningful initiatives.
            </p>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="location-section">
        <div className="location-card card">
          <h3>📍 Find Us</h3>
          <p>
            <strong>Current Address:</strong><br />
            19 Calabar Street, Off Nepa Line, Uyo, Akwa Ibom State, Nigeria
          </p>
        </div>
      </section>
    </div>
  );
}