# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The site serves four audiences, all of whom arrive wanting to judge the group quickly and find the right person. Prospective members (PhD students, postdocs, visiting researchers) check the group's work and people before applying or getting in touch. Collaborators, public health agencies and funders check expertise, partners and recent output. Charité and Charité Center for Global Health (CCGH) colleagues look up who works on what and find the IDD theme, B-IDDE, PING and the short course. Journalists and policymakers look for an expert on a topic.

## Product Purpose

The public website of the Infectious Disease Dynamics (IDD) group at the Charité Center for Global Health (ccgh-idd.de). A visit should first establish that the group is credible and active (research areas, publications, partners, team), and then make it easy to contact the right person.

## Positioning

An interdisciplinary group (mathematical modelling, statistics, clinical trials, policy) studying the ecological and transmission dynamics of infectious diseases to inform control strategies. It hosts the secretariat of Charité's IDD theme, the Berlin Infectious Disease Dynamics Expertise network (B-IDDE) and the Pneumococcal and Pneumonia INterest Group (PING), is an associated member of the Modeling Network for Severe Infectious Diseases (MONID), and runs an annual short course in infectious disease modelling.

## Operating Context

Visitors usually arrive from a search, a paper, a conference, a Charité page or the sister sites (B-IDDE, course.ccgh-idd.de). The site is maintained by group members, not a web team, so content changes must stay simple: team profiles live in `team-data.js` (keyed by the card's `data-member` attribute), partners in `map.js` and `collaborations.json`, publications are loaded live from Europe PMC using the author list at the top of `publications.js`.

## Capabilities and Constraints

- Static HTML, CSS and JavaScript on GitHub Pages; no build step or framework.
- Sections: hero with counted facts and a partner globe, about, research (immunisation, outbreak analytics, climate and evolution), team grid with profile pop-ups, news, publications (Europe PMC, live), software and teaching, partners.
- GDPR: no third-party font or tracking services; any web font must be self-hosted.
- Cache-busting: bump the `?v=` query on any changed CSS or JS file.
- Open: Adriana Tibaduiza Torres's Europe PMC author name is not yet in `publications.js`; the November 2025 medRxiv news item links to the medRxiv homepage rather than the preprint.

## Brand Commitments

- Official spelling "Charité Center for Global Health"; CCGH navy `#002552` with teal `#0d9aa9` (`#0a7682` for small text), shared with the course site.
- Names without middle names (Billy Quilty, Julia Mayer, Rebecca Lais, Lucy Ingaiza), except Adriana Tibaduiza Torres in full. Titles (Prof., Dr.) on team cards; plain names in running text.
- UK English, plain scientific register, no em dashes, no marketing clichés.
- The user has made a minimal, professional direction binding across all three sites: no gradients, drop shadows, glass, pills, hover lifts, scroll reveals, eyebrow labels, side-tab borders, icon tiles or numbered section labels; system font stack with semibold headings (a self-hosted title font is undecided; no serif).

## Evidence on Hand

Team photos in `Pics/`, real news items, a live publication feed, a partner list with locations. There are no testimonials, metrics or rankings, and none should be invented.

## Product Principles

- Credibility comes from real output (papers, partners, people), shown plainly.
- Every visitor should be able to reach the right person within one scroll of finding their topic.
- Content must stay maintainable by researchers editing plain files.
- Restraint over decoration; the three sister sites should read as one family.
