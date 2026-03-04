const OPENCAGE_API_KEY = "0208c6ac7a7843a4936cad179790bf60";

interface GeocodeResponse {
  city?: string;
  state?: string;
  country?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResponse> {
  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}&language=ar`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0].components;
      return {
        city: result.city || result.town || result.village || result.hamlet || result.suburb,
        state: result.state,
        country: result.country
      };
    }
    
    return {};
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return {};
  }
}