import React from "react";
import Navbar from "../components/Navbar";
import ResponsiveGrid from "../components/ResponsiveGrid";
import { menMatches, womenMatches } from "../utils/data";
import "../css/HomePage.css";

const HomePage = () => {
  return (
    <div>
      <Navbar />
      <div className="home-page">
        <ResponsiveGrid title="Men" matches={menMatches} />
        <ResponsiveGrid title="Women" matches={womenMatches} />
      </div>
    </div>
  );
};

export default HomePage;
