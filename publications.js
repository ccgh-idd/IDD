// Recent publications, loaded live from Europe PMC (https://europepmc.org) so the list
// updates itself as new papers and preprints are indexed.
// To add a group member, add their name as Europe PMC writes it ("Surname Initials").
const groupAuthors = [
    "Flasche S", "Quilty BJ", "Hodgson D", "Monoi A", "Kriznar M", "Soubrier H",
    "Mayer J", "Mayer JS", "Masinde A", "Dong K", "Gong D", "Hemmers-Pauly L",
    "Ingaiza L", "Lais RS", "Briga M"
];
const pubsShown = 8;      // visible before "Show more"
const pubsMax = 24;       // fetched in total

(function initPublications() {
    const list = document.getElementById('pub-list');
    const moreBtn = document.getElementById('show-more-pubs');
    const status = document.getElementById('pub-status');
    if (!list) return;

    // Stefan Flasche's papers, plus other members' papers with a Charité affiliation
    // (the affiliation filter avoids papers by unrelated people with the same name)
    const others = groupAuthors.filter(a => a !== "Flasche S").map(a => `AUTH:"${a}"`).join(' OR ');
    const fromYear = new Date().getFullYear() - 2;
    const query = `(AUTH:"Flasche S" OR ((${others}) AND AFF:"Charit")) AND PUB_YEAR:[${fromYear} TO 3000] AND NOT TITLE:"Erratum"`;

    const allLink = document.getElementById('pub-all');
    allLink.href = `https://europepmc.org/search?query=${encodeURIComponent(query)}&sortBy=FIRST_PDATE_D`;

    const url = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + new URLSearchParams({
        query, format: 'json', resultType: 'lite', pageSize: 60
    });

    const titleKey = t => t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    const escapeHtml = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // Titles and journal names can contain <i>, <sub> or <sup> markup, sometimes entity-encoded.
    // Decode entities, escape everything, then restore only those tags (with a space where a
    // species name was run into the neighbouring word).
    const decoder = document.createElement('textarea');
    const decode = s => { decoder.innerHTML = s; return decoder.value; };
    function richText(s) {
        return escapeHtml(decode(decode(s)))
            .replace(/&lt;(\/?)(i|em|sub|sup)&gt;/gi, (m, slash, tag) => `<${slash}${tag.toLowerCase()}>`)
            .replace(/([A-Za-z0-9])<(i|em)>/g, '$1 <$2>')
            .replace(/<\/(i|em)>([A-Za-z0-9])/g, '</$1> $2');
    }

    // Long author lists: first five, then any group members further down
    function formatAuthors(authorString) {
        const authors = authorString.replace(/\.$/, '').split(', ');
        const isMember = a => groupAuthors.includes(a);
        const mark = a => isMember(a) ? `<strong>${escapeHtml(a)}</strong>` : escapeHtml(a);
        if (authors.length <= 6) return authors.map(mark).join(', ');
        const later = authors.slice(5).filter(isMember);
        return [...authors.slice(0, 5).map(mark), ...(later.length ? ['…', ...later.map(mark)] : []), 'et al.'].join(', ');
    }

    function render(results) {
        // Drop preprints that have since been published, then newest first
        const published = new Set(results.filter(r => r.source !== 'PPR').map(r => titleKey(r.title)));
        const pubs = results
            .filter(r => r.source !== 'PPR' || !published.has(titleKey(r.title)))
            .sort((a, b) => (b.firstPublicationDate || '').localeCompare(a.firstPublicationDate || ''))
            .slice(0, pubsMax);

        if (pubs.length === 0) throw new Error('no results');

        list.innerHTML = pubs.map((r, i) => {
            const link = r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/${r.source}/${r.id}`;
            const isPreprint = r.source === 'PPR';
            const venue = r.journalTitle || r.bookOrReportDetails?.publisher || '';
            const date = new Date(r.firstPublicationDate);
            const when = isNaN(date) ? (r.pubYear || '') : date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
            return `
                <li class="pub-item"${i >= pubsShown ? ' hidden' : ''}>
                    <span class="pub-date">${when}</span>
                    <div>
                        <a class="pub-title" href="${link}" target="_blank" rel="noopener">${richText(r.title).replace(/\.$/, '')}</a>
                        <p class="pub-authors">${formatAuthors(r.authorString || '')}</p>
                        <p class="pub-venue">${[isPreprint ? 'Preprint' : '', venue ? `<em>${richText(venue)}</em>` : ''].filter(Boolean).join(', ')}</p>
                    </div>
                </li>`;
        }).join('');

        status.hidden = true;
        const hiddenItems = [...list.querySelectorAll('.pub-item[hidden]')];
        moreBtn.hidden = hiddenItems.length === 0;
        moreBtn.addEventListener('click', () => {
            const expand = hiddenItems[0].hidden;
            hiddenItems.forEach(li => { li.hidden = !expand; });
            moreBtn.textContent = expand ? 'Show fewer' : 'Show more publications';
        });
    }

    fetch(url)
        .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
        .then(data => render(data.resultList.result))
        .catch(() => {
            status.textContent = 'The publication list could not be loaded just now. ';
            status.append(Object.assign(document.createElement('a'), {
                href: allLink.href, target: '_blank', rel: 'noopener', textContent: 'View our publications on Europe PMC'
            }));
        });
})();
