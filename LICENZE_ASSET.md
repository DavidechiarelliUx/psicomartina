# Censimento licenze asset — psicomartina

Documento di tracciamento delle licenze di font, immagini e librerie usate nel sito.
Aggiornato: Giugno 2026.

## Librerie / dipendenze (codice)
| Asset | Licenza | Uso commerciale | Note |
|-------|---------|-----------------|------|
| React, Vite | MIT | ✅ | — |
| Radix UI / shadcn/ui | MIT | ✅ | Componenti `src/components/ui` |
| lucide-react (icone) | ISC | ✅ | — |
| framer-motion | MIT | ✅ | — |
| Tailwind CSS | MIT | ✅ | — |
| Prisma | Apache-2.0 | ✅ | — |

## Font
| Font | Licenza | Stato | Azione consigliata |
|------|---------|-------|--------------------|
| Playfair Display | SIL OFL 1.1 | ✅ licenza ok | — |
| Inter | SIL OFL 1.1 | ✅ licenza ok | — |

⚠️ **Privacy/GDPR**: i font sono caricati via `@import` dal CDN di Google
(`fonts.googleapis.com` / `fonts.gstatic.com`) in `src/index.css`. Questo trasferisce
l'indirizzo IP del visitatore a Google. Per piena conformità GDPR si raccomanda di
**self-hostare i font** (scaricare i file .woff2 e servirli dal proprio dominio,
sostituendo l'`@import` con regole `@font-face` locali). Da fare in un intervento dedicato.

## Immagini (`public/images/`)
| File | Origine | Stato | Azione |
|------|---------|-------|--------|
| `martina_giovinazzo.png` | Foto della professionista (presunta) | ⏳ da confermare | Confermare proprietà/liberatoria |
| `dott4-3.png` | Foto/ritratto | ⏳ da confermare | Confermare proprietà |
| `studio.png` | Foto dello studio | ⏳ da confermare | Confermare proprietà o licenza stock |
| `blog-cover.png` | Copertina blog | ⏳ da confermare | Confermare origine/licenza |
| `logo_bianco_senza_sfondo.png`, `icona_dott.png`, `favicon_*` | Logo/branding | ⏳ da confermare | Confermare che il logo sia originale o su licenza |
| `*.svg` (hero-portrait, studio, blog-cover) | Placeholder grafici | ✅ presumibilmente originali | — |

> AZIONE RICHIESTA AL TITOLARE: confermare per ciascuna immagine fotografica di esserne
> proprietario o di disporre di licenza per uso commerciale/web. Per eventuali ritratti di
> persone serve la relativa liberatoria all'uso dell'immagine. Sostituire gli asset dubbi
> con materiale di proprietà o con stock a licenza verificata (es. Unsplash/Pexels con
> attribuzione ove richiesta, o stock a pagamento).
