// Interactive globe (D3 orthographic projection, transparent ocean)
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
    { "name": "Malawi Liverpool Wellcome Programme", "city": "Blantyre, Malawi", "lat": -15.8055, "lon": 35.0062 },
    { "name": "KEMRI-Wellcome Trust Research Programme", "city": "Kilifi, Kenya", "lat": -3.6333, "lon": 39.8500 },
    { "name": "NICD South Africa", "city": "Johannesburg, South Africa", "lat": -26.1265, "lon": 28.1258 },
    { "name": "MRC Unit The Gambia", "city": "Fajara, The Gambia", "lat": 13.4735, "lon": -16.6749 },
    { "name": "Pasteur Institute Nha Trang", "city": "Nha Trang, Vietnam", "lat": 12.2471, "lon": 109.1965 },
    { "name": "Save the Children Somalia", "city": "Hargeisa, Somalia", "lat": 9.5624, "lon": 44.0770 },
    { "name": "Murdoch Children's Research Institute", "city": "Melbourne, Australia", "lat": -37.7964, "lon": 144.9612 },
    { "name": "Helmholtz Centre for Infection Research", "city": "Braunschweig, Germany", "lat": 52.2306, "lon": 10.5258 },
    { "name": "MASHA at University of Cape Town", "city": "Cape Town, South Africa", "lat": -33.9249, "lon": 18.4241 },
    { "name": "German-West African Centre for Global Health Research", "city": "Accra, Ghana", "lat": 5.5580, "lon": -0.2014 }
];

const homeLoc = { name: "IDD @ Charité Center for Global Health", city: "Berlin, Germany", lat: berlinCoords[0], lon: berlinCoords[1], home: true };
const allLocs = [homeLoc, ...locations];

// Text list of the same partners, sorted by name
const partnerList = document.getElementById('partner-list');
if (partnerList) {
    [...locations].sort((a, b) => a.name.localeCompare(b.name)).forEach(l => {
        const li = document.createElement('li');
        li.textContent = l.name;
        const city = document.createElement('span');
        city.textContent = l.city;
        li.append(city);
        partnerList.append(li);
    });
}

(async function initGlobe() {
    const container = document.getElementById('map');
    container.classList.add('globe-container');
    // Read out as one image; the partner list is the text equivalent
    container.setAttribute('aria-label', `Globe showing ${locations.length} partner institutions; the full list is under Partners`);
    const svg = d3.select(container).append('svg').attr('aria-hidden', 'true');
    const tooltip = d3.select(container).append('div').attr('class', 'globe-tooltip');

    const projection = d3.geoOrthographic().clipAngle(90).rotate([-berlinCoords[1], -25]);
    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule10();

    const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'globe-sphere');
    const grid = svg.append('path').datum(graticule).attr('class', 'globe-graticule');
    const land = svg.append('path').attr('class', 'globe-land');
    const arcs = svg.append('g').attr('class', 'globe-arcs');
    const markers = svg.append('g').attr('class', 'globe-markers');

    // world-atlas 2.0.2, self-hosted so no visitor data goes to a CDN
    const world = await fetch('vendor/land-110m.json?v=2.0.2').then(res => res.json());
    land.datum(topojson.feature(world, world.objects.land));

    const links = locations.map(l => ({ type: 'LineString', coordinates: [[berlinCoords[1], berlinCoords[0]], [l.lon, l.lat]] }));
    arcs.selectAll('path').data(links).join('path');

    const dots = markers.selectAll('circle').data(allLocs).join('circle')
        .attr('r', d => d.home ? 7 : 5)
        .classed('home', d => d.home)
        .on('mouseenter', (e, d) => {
            tooltip.html(`<strong>${d.name}</strong><span>${d.city}</span>`).classed('visible', true);
        })
        .on('mousemove', e => {
            const [x, y] = d3.pointer(e, container);
            // Keep the tooltip inside the globe area on narrow screens
            const half = tooltip.node().offsetWidth / 2;
            const left = Math.max(half, Math.min(container.clientWidth - half, x));
            tooltip.style('left', `${left}px`).style('top', `${y}px`);
        })
        .on('mouseleave', () => tooltip.classed('visible', false));

    function render() {
        sphere.attr('d', path);
        grid.attr('d', path);
        land.attr('d', path);
        arcs.selectAll('path').attr('d', path);
        const center = projection.invert([projection.translate()[0], projection.translate()[1]]);
        dots.each(function (d) {
            const visible = d3.geoDistance([d.lon, d.lat], center) < Math.PI / 2;
            const [x, y] = projection([d.lon, d.lat]);
            d3.select(this).attr('cx', x).attr('cy', y).style('display', visible ? null : 'none');
        });
    }

    function resize() {
        const w = container.clientWidth, h = container.clientHeight;
        svg.attr('viewBox', `0 0 ${w} ${h}`);
        projection.translate([w / 2, h / 2]).scale(Math.min(w, h) / 2 - 10);
        render();
    }
    new ResizeObserver(resize).observe(container);
    resize();

    // Drag to rotate (the globe stays still otherwise and only redraws while dragged)
    svg.call(d3.drag()
        .on('drag', e => {
            const r = projection.rotate(), k = 75 / projection.scale();
            projection.rotate([r[0] + e.dx * k, Math.max(-90, Math.min(90, r[1] - e.dy * k))]);
            render();
        }));
})();
