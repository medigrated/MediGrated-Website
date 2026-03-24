// server/controllers/recommendations/recommendations-controller.js
const axios = require('axios');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const getRecommendations = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const type = (req.query.type || 'clinic').toLowerCase();

    console.log('[recommendations] request for', { lat, lon, type, user: req.user?.id });

    if (!lat || !lon || Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ success: false, message: 'lat and lon query params are required and must be numbers' });
    }

    const googleKey = process.env.GOOGLE_PLACES_API_KEY;
    if (googleKey) {
      // (Your Google Places logic — unchanged)
      const googleTypeMap = { clinic: 'hospital', hospital: 'hospital', pharmacy: 'pharmacy' };
      const placeType = googleTypeMap[type] || 'hospital';
      const radius = 5000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
      const params = { key: googleKey, location: `${lat},${lon}`, radius, type: placeType };
      const response = await axios.get(url, { params });
      const results = response.data.results || [];
      const places = results.map(r => ({
        id: r.place_id,
        name: r.name,
        address: r.vicinity || r.formatted_address,
        location: { lat: r.geometry.location.lat, lon: r.geometry.location.lng },
        rating: r.rating,
        userRatingsTotal: r.user_ratings_total,
        distanceKm: Number(haversineDistance(lat, lon, r.geometry.location.lat, r.geometry.location.lng).toFixed(2)),
        googleLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}&query_place_id=${r.place_id}`
      }));

      if (places.length > 0) return res.json({ success: true, source: 'google', places });
      console.log('[recommendations] google returned 0 results');
    }

    // Fallback OSM/Nominatim
    const osmTypeMap = { clinic: 'clinic', hospital: 'hospital', pharmacy: 'pharmacy' };
    const amenity = osmTypeMap[type] || 'clinic';
    const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
    const qParams = {
      format: 'json',
      q: amenity,
      limit: 15,
      viewbox: `${lon-0.05},${lat+0.05},${lon+0.05},${lat-0.05}`,
      bounded: 1,
      addressdetails: 1
    };

    const osmRes = await axios.get(nominatimUrl, { params: qParams, headers: { 'User-Agent': 'Medigrated/1.0 (dev)' }});
    const osmResults = osmRes.data || [];

    const places = osmResults.map(r => {
      const rlLat = parseFloat(r.lat);
      const rlLon = parseFloat(r.lon);
      return {
        id: r.place_id || `${rlLat}_${rlLon}`,
        name: (r.display_name || '').split(',')[0] || r.display_name,
        address: r.display_name,
        location: { lat: rlLat, lon: rlLon },
        distanceKm: Number(haversineDistance(lat, lon, rlLat, rlLon).toFixed(2)),
        osmLink: `https://www.openstreetmap.org/?mlat=${rlLat}&mlon=${rlLon}#map=18/${rlLat}/${rlLon}`,
      };
    });

    if (places.length > 0) {
      places.sort((a,b) => a.distanceKm - b.distanceKm);
      return res.json({ success: true, source: 'osm', places });
    }

    // ---- DEVELOPMENT FALLBACK: return small mock set so frontend can render while you build ----
    if (process.env.NODE_ENV !== 'production') {
      console.log('[recommendations] no real places found — returning dev mock places');
      const mockPlaces = [
        {
          id: 'mock-1',
          name: 'Medigrated Clinic (Demo)',
          address: '123 Example St, Nearby City',
          location: { lat: lat + 0.002, lon: lon + 0.002 },
          distanceKm: Number(haversineDistance(lat, lon, lat + 0.002, lon + 0.002).toFixed(2)),
          osmLink: `https://www.openstreetmap.org/`
        },
        {
          id: 'mock-2',
          name: 'Neighborhood Pharmacy (Demo)',
          address: '45 Local Rd, Nearby City',
          location: { lat: lat - 0.003, lon: lon - 0.001 },
          distanceKm: Number(haversineDistance(lat, lon, lat - 0.003, lon - 0.001).toFixed(2)),
          osmLink: `https://www.openstreetmap.org/`
        }
      ];
      return res.json({ success: true, source: 'mock', places: mockPlaces });
    }

    // If production and nothing found
    return res.json({ success: true, source: 'none', places: [] });
  } catch (err) {
    console.error('getRecommendations error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error fetching nearby places' });
  }
};

module.exports = { getRecommendations };
