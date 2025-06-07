const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const fetchMatchups = async () => {
    try {
      const response = await fetch(`${API_URL}/api/scores`);
      if (!response.ok) {
        throw new Error("Failed to fetch matchups");
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return { men: [], women: [] };
    }
  };
  