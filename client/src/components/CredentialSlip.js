import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import '../styles/CredentialSlip.css';

export default function CredentialSlip({ students, onClose }) {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ content: () => printRef.current });

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-wide">
        <div className="modal-header">
          <h2>Student Credential Slips</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="alert alert-info">
          ✂️ Print and cut out each slip. Hand them to students in class. Students use these to log in at any device.
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print All Slips</button>
          <button className="btn btn-outline" onClick={onClose}>Done</button>
        </div>

        <div ref={printRef} className="credential-slips-print">
          {students.map((s, i) => (
            <div key={i} className="credential-slip">
              <div className="slip-header">
                <div className="slip-emblem">BG</div>
                <div>
                  <div className="slip-school">Borngreat School</div>
                  <div className="slip-sub">Student Login Credentials</div>
                </div>
              </div>
              <div className="slip-divider"></div>
              <div className="slip-row">
                <span>Name:</span>
                <strong>{s.fullName}</strong>
              </div>
              <div className="slip-row">
                <span>Class:</span>
                <strong>{s.className} {s.section}</strong>
              </div>
              <div className="slip-row highlight">
                <span>Student ID:</span>
                <strong className="slip-id">{s.studentId}</strong>
              </div>
              <div className="slip-row highlight">
                <span>Default PIN:</span>
                <strong className="slip-pin">{s.defaultPin || '0000'}</strong>
              </div>
              <div className="slip-footer">
                🔒 Change your PIN after first login. Visit your school portal to check results.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}