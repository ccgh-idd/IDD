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

const homeLoc = { name: "IDD @ Charité Center for Global Health", city: "Berlin, Germany", lat: berlinCoords[0], lon: berlinCoords[1], home: true };
const allLocs = [homeLoc, ...locations];

(async function initGlobe() {
    const container = document.getElementById('map');
    container.classList.add('globe-container');
    const svg = d3.select(container).append('svg');
    const tooltip = d3.select(container).append('div').attr('class', 'globe-tooltip');

    const projection = d3.geoOrthographic().clipAngle(90).rotate([-berlinCoords[1], -25]);
    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule10();

    const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'globe-sphere');
    const grid = svg.append('path').datum(graticule).attr('class', 'globe-graticule');
    const land = svg.append('path').attr('class', 'globe-land');
    const arcs = svg.append('g').attr('class', 'globe-arcs');
    const markers = svg.append('g').attr('class', 'globe-markers');

    const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json');
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
            tooltip.style('left', `${x}px`).style('top', `${y}px`);
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

    // Drag to rotate
    let dragging = false, lastInteraction = 0;
    svg.call(d3.drag()
        .on('start', () => { dragging = true; })
        .on('drag', e => {
            const r = projection.rotate(), k = 75 / projection.scale();
            projection.rotate([r[0] + e.dx * k, Math.max(-90, Math.min(90, r[1] - e.dy * k))]);
            render();
        })
        .on('end', () => { dragging = false; lastInteraction = performance.now(); }));

    // Gentle auto-rotation (paused while dragging, off for reduced motion)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
        let last = performance.now();
        d3.timer(() => {
            const now = performance.now(), dt = now - last; last = now;
            if (dragging || now - lastInteraction < 3000) return;
            const r = projection.rotate();
            projection.rotate([r[0] + dt * 0.006, r[1]]);
            render();
        });
    }
})();
