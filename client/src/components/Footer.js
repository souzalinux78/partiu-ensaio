import React, { useState } from 'react';
import PoliticaPrivacidade from './PoliticaPrivacidade';
import TermoUso from './TermoUso';
import './Footer.css';

const Footer = () => {
  const [showPolitica, setShowPolitica] = useState(false);
  const [showTermo, setShowTermo] = useState(false);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <p className="footer-copyright">
              © {currentYear} Partiu Ensaio. Todos os direitos reservados.
            </p>
          </div>
          <div className="footer-links">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowPolitica(true);
              }}
              className="footer-link"
            >
              Política de Privacidade
            </a>
            <span className="footer-separator">|</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowTermo(true);
              }}
              className="footer-link"
            >
              Termo de Uso
            </a>
          </div>
        </div>
      </footer>
      <PoliticaPrivacidade 
        isOpen={showPolitica} 
        onClose={() => setShowPolitica(false)} 
      />
      <TermoUso 
        isOpen={showTermo} 
        onClose={() => setShowTermo(false)} 
      />
    </>
  );
};

export default Footer;
