import React from 'react';
import { Link } from 'react-router-dom';
import '../css/Header.css';

const Header = () => {
  return (
    <header className="minimalist-header">
      <Link to="/" className="brand-link">
        <div className="brand-container">
          <img 
            src="/logo.png" 
            alt="Ivy League Fencing Logo" 
            className="ivy-logo"
          />
          <span className="brand-name">Ivy Live Score</span>
        </div>
      </Link>
    </header>
  );
};

export default Header; 