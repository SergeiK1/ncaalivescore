import React from "react";
import "../css/SectionTitle.css";

const SectionTitle = ({ title }) => {
  return (
    <div className="section-title">
      <h2>{title}</h2>
    </div>
  );
};

export default SectionTitle;
