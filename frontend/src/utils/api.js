const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const fetchMatchups = async () => {
  try {
    // Add cache-busting timestamp to prevent caching
    const timestamp = Date.now();
    const url = `${API_URL}/api/scores?t=${timestamp}&nocache=${Math.random()}`;
    
    console.log('🔄 Fetching scores from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Scores fetched successfully:', {
      serverTime: data.serverTime,
      lastUpdated: data.lastUpdated,
      menMatches: data.men?.length || 0,
      womenMatches: data.women?.length || 0
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching matchups:', error);
    return { men: [], women: [] };
  }
};
  