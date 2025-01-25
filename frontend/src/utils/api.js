export const fetchMatchups = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/scores");
      if (!response.ok) {
        throw new Error("Failed to fetch matchups");
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return { men: [], women: [] };
    }
  };
  