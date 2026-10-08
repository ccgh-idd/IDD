// Initialize the map, centered to show global connections
const map = L.map('map').setView([20, 10], 2);

// Add Grayscale Tiles (Esri World Light Gray Canvas, no API key required)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
}).addTo(map);

// Add the grayscale class for additional CSS filtering if needed
document.getElementById('map').classList.add('map-grayscale');

const berlinCoords = [52.5260, 13.3777];

// Revised collaboration locations
const locations = [
    { "name": "London School of Hygiene & Tropical Medicine", "city": "London, UK", "lat": 51.5207, "lon": -0.1296 },
    { "name": "Nagasaki University", "city": "Nagasaki, Japan", "lat": 32.7745, "lon": 129.8643 },
    { "name": "University of Edinburgh", "city": "Edinburgh, UK", "lat": 55.9443, "lon": -3.1883 },
    { "name": "Wellcome Sanger Institute", "city": "Hinxton, UK", "lat": 52.0792, "lon": 0.1856 },
    { "name": "Robert Koch Institute", "city": "Berlin, Germany", "lat": 52.5398, "lon": 13.3486 },
    { "name": "World Health Organization", "city": "Geneva, Switzerland", "lat": 46.2044, "lon": 6.1432 },
    { "name": "Yale School of Public Health", "city": "New Haven, USA", "lat": 41.3039, "lon": -72.9298 },
    { "name": "Malawi Liverpool Wellcome Trust", "city": "Blantyre, Malawi", "lat": -15.8055, "lon": 35.0062 },
    { "name": "KEMRI-Wellcome Trust", "city": "Kilifi, Kenya", "lat": -3.6333, "lon": 39.8500 },
    { "name": "NICD South Africa", "city": "Johannesburg, South Africa", "lat": -26.1265, "lon": 28.1258 },
    { "name": "MRC Unit The Gambia", "city": "Fajara, Gambia", "lat": 13.4735, "lon": -16.6749 },
    { "name": "Pasteur Institute Nha Trang", "city": "Nha Trang, Vietnam", "lat": 12.2471, "lon": 109.1965 },
    { "name": "Save the Children Somalia", "city": "Hargeisa, Somalia", "lat": 9.5624, "lon": 44.0770 },
    { "name": "Murdoch Children's Research Institute", "city": "Melbourne, Australia", "lat": -37.7964, "lon": 144.9612 },
    { "name": "Helmholtz Centre for Infection Research", "city": "Hannover, Germany", "lat": 52.3486, "lon": 10.0163 },
    { "name": "MASHA at University of Cape Town", "city": "Cape Town, South Africa", "lat": -33.9249, "lon": 18.4241 },
    { "name": "German-West African Centre for Global Health Research", "city": "Accra, Ghana", "lat": 5.5580, "lon": -0.2014 }
];

// Custom modern marker icon
const modernIcon = L.divIcon({
    className: 'modern-marker',
    html: '<div style="width: 12px; height: 12px; background: #0d9aa9; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,37,82,0.3);"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Home marker (Berlin)
L.marker(berlinCoords, { icon: modernIcon }).addTo(map)
    .bindPopup('<strong>IDD @ Charité Center for Global Health</strong><span>Berlin, Germany</span>');

locations.forEach(loc => {
    // Add Marker
    L.marker([loc.lat, loc.lon], { icon: modernIcon })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><span>${loc.city}</span>`);

    // Add Connection Line to Berlin
    L.polyline([berlinCoords, [loc.lat, loc.lon]], {
        color: '#002552',
        weight: 1.5,
        opacity: 0.4,
        dashArray: '5, 10',
        lineCap: 'round'
    }).addTo(map);
});
