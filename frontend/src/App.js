import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SchoolSelector from "./pages/SchoolSelector";
import MatchResults from "./pages/MatchResults";
import AllMatches from "./pages/HomePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SchoolSelector />} />
        <Route path="/match/:gender/:team1/:team2" element={<MatchResults />} />
        <Route path="/all-matches" element={<AllMatches />} />
      </Routes>
    </Router>
  );
}

export default App;
