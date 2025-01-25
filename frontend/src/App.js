import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MatchPage from "./pages/MatchPage";

const App = () => {
  return (
    <div>
      <Routes>
        {/* Route for the homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Dynamic route for match-specific pages */}
        <Route path="/match/:id" element={<MatchPage />} />
      </Routes>
    </div>
  );
};

export default App;
