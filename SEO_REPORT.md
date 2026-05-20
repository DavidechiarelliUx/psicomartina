# SEO Report - Psicomartina

## Framework rilevato

- React + Vite
- Routing: React Router v6
- Meta tag gestiti con componente centralizzato `src/components/SEOHead.jsx`
- Dominio configurato: `https://psicomartina.it`

## Mappa pagine e meta description

| Path | Title | Meta description |
| --- | --- | --- |
| `/` | Psicologa e Psicoterapeuta a Roma | Scopri un supporto psicologico personalizzato per ansia, relazioni e autostima. Prenota un primo colloquio e inizia il tuo percorso con fiducia. |
| `/chi-sono` | Chi Sono | Conosci Martina Giovinazzo, psicologa e psicoterapeuta a Roma. Scopri approccio, formazione e valori per scegliere il percorso più adatto a te. |
| `/servizi` | Servizi di Psicologia | Scopri i servizi di psicologia per ansia, stress, relazioni, autostima e traumi. Prenota un colloquio per trovare il percorso più adatto a te. |
| `/come-funziona` | Come Funziona | Scopri come funziona il percorso psicologico, dal primo contatto alle sedute online o in studio. Prenota un colloquio conoscitivo senza impegno. |
| `/blog` | Blog di Psicologia | Leggi articoli di psicologia su ansia, relazioni, autostima e benessere. Scopri risorse utili per prenderti cura di te ogni giorno con consapevolezza. |
| `/blog/ansia-respiro-consapevole` | Ansia e respiro: piccoli gesti per ritrovare presenza | Leggi come gestire ansia e respiro con pratiche semplici di presenza. Scopri piccoli gesti per ritrovare calma nei momenti difficili della giornata. |
| `/blog/confini-relazioni` | Confini nelle relazioni: dire no senza perdere contatto | Scopri come mettere confini nelle relazioni e dire no con rispetto. Leggi strumenti utili per comunicare bisogni e proteggere il benessere personale. |
| `/blog/autostima-gentilezza` | Autostima e gentilezza verso di sé | Leggi come coltivare autostima e gentilezza verso di sé nei momenti difficili. Scopri un modo più accogliente di parlarti e cambiare con cura. |
| `/contatti` | Contatti e Prenotazioni | Contatta lo studio di psicologia per informazioni, disponibilità e prenotazioni. Prenota il primo colloquio e ricevi risposta entro 24 ore lavorative. |
| `/privacy` | Privacy Policy | Leggi la privacy policy dello studio e scopri come vengono trattati dati, richieste di contatto e prenotazioni nel rispetto del GDPR e della riservatezza. |
| `/dashboard` | Dashboard | Accedi alla dashboard privata per gestire appuntamenti, contatti e richieste dello studio in modo ordinato, riservato e sempre aggiornato ogni giorno. |
| `*` | Pagina non trovata | La pagina che cerchi non esiste o è stata spostata. Torna alla Home o visita i Contatti per trovare il supporto psicologico più adatto a te. |

## Meta tag implementati

- `title`
- `meta[name="description"]`
- `meta[name="robots"]`
- `link[rel="canonical"]`
- `meta[property="og:title"]`
- `meta[property="og:description"]`
- `meta[property="og:type"]`
- `meta[property="og:url"]`
- `meta[name="twitter:card"]`
- `meta[name="twitter:title"]`
- `meta[name="twitter:description"]`

Le pagine pubbliche usano `index, follow`. Dashboard, loading articolo, articolo non trovato e 404 usano `noindex, nofollow`.

## Pagina 404

- Creata pagina personalizzata: `src/pages/NotFound.jsx`
- Registrata come ultima route React Router: `path="*"`
- Layout coerente con il sito, con link verso Home, Contatti e Blog
- Meta robots: `noindex, nofollow`
- Configurato Vite per rispondere con HTTP `404` sulle navigazioni HTML verso URL inesistenti.

Verifica locale:

- `/` -> HTTP `200`
- `/dashboard` -> HTTP `200` con meta `noindex, nofollow`
- `/pagina-inesistente` con `Accept: text/html` -> HTTP `404`

## Immagini e alt tag

Tutte le immagini `<img>` nel progetto hanno un attributo `alt` descrittivo.

Alt verificati/corretti:

- `src/pages/About.jsx` - ritratto professionale e immagine studio
- `src/pages/Blog.jsx` - immagine placeholder blog e cover articoli
- `src/pages/BlogPost.jsx` - cover articolo
- `src/components/home/AboutPreview.jsx` - immagine anteprima profilo
- `src/components/home/HeroSection.jsx` - immagine hero

## Link interni

- Route pubbliche verificate: `/`, `/chi-sono`, `/servizi`, `/come-funziona`, `/blog`, `/contatti`, `/privacy`
- Link interni alla Privacy convertiti a `Link` React Router dove erano dentro componenti React interattivi.
- Link telefonici e mailto lasciati come `<a>` perché corretti semanticamente.

## Robots e sitemap

- `public/robots.txt`: `https://psicomartina.it/robots.txt`
- `public/sitemap.xml`: `https://psicomartina.it/sitemap.xml`

La sitemap include tutte le route pubbliche e i tre articoli locali del blog. Dashboard, admin e API sono escluse da robots.

## Verifiche tecniche

- `npm run lint`: OK
- `npm run build`: OK
- Warning build residuo: bundle JavaScript sopra 500 kB. Non blocca la SEO, ma si può ottimizzare in futuro con code splitting.

## TODO

- Se il dominio finale non sarà `https://psicomartina.it`, aggiornare `VITE_SITE_URL`, `index.html`, `public/robots.txt` e `public/sitemap.xml`.
- In produzione, verificare che l'hosting scelto rispetti lo status HTTP `404` per gli URL inesistenti. La configurazione Vite copre dev e preview; alcune piattaforme statiche richiedono una regola dedicata.
