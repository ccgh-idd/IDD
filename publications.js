// Publications: the most recent PubMed records with at least one team member as author.
// Fetched live from NCBI E-utilities, so the list updates itself as new papers are indexed.
(function () {
    // [last name, first name(s) exactly as PubMed records them]
    const team = [
        ['Flasche', 'Stefan'], ['Hodgson', 'David'], ['Quilty', 'Billy J'], ['Kriznar', 'Matej'],
        ['Masinde', 'Augustine'], ['Dong', 'Kaige'], ['Gong', 'Dexin'], ['Hemmers-Pauly', 'Lukas'],
        ['Ingaiza', 'Lucy Mbone'], ['Lais', 'Rebecca Sophia'], ['Mayer', 'Julia Stéphanie'], ['Soubrier', 'Hugo'],
        ['Torres', 'Adriana'], ['Oye', 'Hendrik'], ['Briga', 'Michael'], ['Monoi', 'Ayaka']
    ];
    // Shared names only count when that author's own affiliation is one of ours
    const ownAffiliation = /charit|london school of hygiene|lshtm/i;
    const SHOW = 5;

    // Stefan's older papers list only his initial, and the surname is unique
    const term = '(Flasche S[au] OR ' + team.map(([last, first]) => `"${last}, ${first}"[fau]`).join(' OR ') + ')'
        + ' AND (Charite[ad] OR "London School of Hygiene"[ad])';
    const eutils = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

    const list = document.getElementById('pub-list');
    document.getElementById('pub-all').href =
        'https://pubmed.ncbi.nlm.nih.gov/?sort=date&term=' + encodeURIComponent(term);

    const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const firstName = s => norm(s).split(/[\s.]/)[0];
    const isTeam = (last, fore) => team.some(([l, f]) => norm(l) === norm(last)
        && (norm(l) === 'flasche' || firstName(fore) === firstName(f)));

    async function load() {
        const search = await fetch(`${eutils}esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=40&term=${encodeURIComponent(term)}`)
            .then(r => r.json());
        const ids = search.esearchresult.idlist;
        if (!ids.length) throw new Error('no results');

        const xml = await fetch(`${eutils}efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(',')}`).then(r => r.text());
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const text = (el, sel) => el.querySelector(sel)?.textContent.trim() || '';

        const pubs = [];
        for (const art of doc.querySelectorAll('PubmedArticle')) {
            let hasMember = false;
            const authors = [...art.querySelectorAll('AuthorList > Author')].map(a => {
                const last = text(a, 'LastName') || text(a, 'CollectiveName');
                const fore = text(a, 'ForeName') || text(a, 'Initials');
                const aff = [...a.querySelectorAll('Affiliation')].map(x => x.textContent).join(' ');
                const member = isTeam(last, fore) && (norm(last) === 'flasche' || ownAffiliation.test(aff));
                if (member) hasMember = true;
                return { name: `${last} ${text(a, 'Initials')}`.trim(), member };
            });
            if (!hasMember) continue;
            pubs.push({
                pmid: text(art, 'PMID'),
                title: text(art, 'ArticleTitle'),
                journal: text(art, 'Journal > ISOAbbreviation') || text(art, 'Journal > Title'),
                year: text(art, 'JournalIssue PubDate Year') || text(art, 'JournalIssue PubDate MedlineDate').slice(0, 4),
                authors
            });
            if (pubs.length === SHOW) break;
        }
        render(pubs);
    }

    function render(pubs) {
        list.replaceChildren(...pubs.map(p => {
            const li = document.createElement('li');
            li.className = 'pub-item';

            const title = document.createElement('a');
            title.className = 'pub-title';
            title.href = `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`;
            title.target = '_blank';
            title.rel = 'noopener';
            title.textContent = p.title;

            // Long author lists: keep the first few plus every team member
            const authors = document.createElement('p');
            authors.className = 'pub-authors';
            let skipped = false;
            p.authors.forEach((a, i) => {
                const keep = i < 6 || a.member || i === p.authors.length - 1;
                if (!keep) { skipped = true; return; }
                if (authors.childNodes.length) authors.append(skipped ? ', … ' : ', ');
                skipped = false;
                if (a.member) {
                    const b = document.createElement('strong');
                    b.textContent = a.name;
                    authors.append(b);
                } else {
                    authors.append(a.name);
                }
            });

            const meta = document.createElement('p');
            meta.className = 'pub-meta';
            meta.textContent = [p.journal, p.year].filter(Boolean).join(' · ');

            li.append(meta, title, authors);
            return li;
        }));
    }

    load().catch(() => {
        list.innerHTML = '<li class="pub-status">Publications could not be loaded right now. See the full list on PubMed.</li>';
    });
})();
