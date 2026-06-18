# Audit infrastruttura — Vercel & Neon

Verifica eseguita: Giugno 2026 (progetto Vercel `psicomartina`, team davidechiarelliux).

## Risultati Vercel

### 🔴 1. Dominio personalizzato non collegato / canonical incoerente
Il progetto risulta servito sui domini:
- `psicomartina.vercel.app`
- `psicomartina-davidechiarelliuxs-projects.vercel.app`
- `psicomartina-git-main-davidechiarelliuxs-projects.vercel.app`

Ma il sito dichiara ovunque come URL canonico **`https://psicomartina.it`** (vedi `index.html`,
`src/config/seo.js`, `public/sitemap.xml`, `public/robots.txt`). Il dominio `psicomartina.it`
**non risulta collegato** al progetto.

- **Rischio**: problemi SEO (canonical verso un dominio non attivo), link/sitemap errati,
  e CORS allowlist (`server/app.js`) che punta a un dominio non in uso.
- **Azione**: collegare `psicomartina.it` (e `www`) al progetto su Vercel **oppure** allineare
  tutti i riferimenti al dominio realmente in uso. Aggiornare di conseguenza `ALLOWED_ORIGINS`.

### 🟠 2. Deployment di preview pubblicamente accessibili
Le URL di preview/branch (`...-git-main-...vercel.app`, `...-<hash>-...vercel.app`) sono
raggiungibili pubblicamente ed espongono la **stessa applicazione e le stesse API** che trattano
dati sanitari.

- **Rischio**: accesso non controllato a endpoint e dati tramite URL di preview indicizzabili.
- **Azione**: abilitare **Vercel Deployment Protection** (Settings → Deployment Protection →
  "Vercel Authentication" o password) per proteggere preview e deployment non di produzione.

### 🟠 3. Variabili d'ambiente — checklist
Verificare in Vercel → Settings → Environment Variables che:
- `JWT_SECRET` sia impostato, lungo e casuale (≥ 16 caratteri). **Senza, l'app non parte** (voluto).
- `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD` siano robusti e non valori di default.
- `DATABASE_URL` (Neon) sia presente solo come variabile server (mai `VITE_`).
- Le chiavi `CLOUDINARY_*`, `EMAIL_*` non siano mai esposte con prefisso `VITE_`
  (le `VITE_` finiscono nel bundle pubblico!). Le variabili sensibili attuali NON hanno prefisso
  `VITE_`: corretto. Mantenere questa separazione.
- Eventuale `ALLOWED_ORIGINS` allineato ai domini reali.

> ⚠️ Le variabili con prefisso `VITE_` (`VITE_STUDIO_*`, `VITE_SITE_URL`) sono **pubbliche** e
> incluse nel JavaScript servito al browser: usarle solo per dati non riservati (indirizzo,
> telefono pubblico, email pubblica, P.IVA, n. Albo). Non inserirvi mai segreti.

### 🟡 4. Log di runtime
I log delle funzioni serverless possono contenere dati personali (es. payload di prenotazione,
email). Evitare `console.log` di payload completi in produzione e verificare la retention dei log
su Vercel. Attualmente l'app logga solo errori Cloudinary: ok.

## Risultati Neon (da verificare nel pannello Neon)
- Confermare che la stringa di connessione usi **SSL** (`sslmode=require`) — Neon lo impone di default.
- Verificare che non esistano branch/ruoli di sola lettura esposti pubblicamente.
- Abilitare, se disponibile nel piano, i **backup/point-in-time restore**.
- Limitare gli IP/accessi se il piano lo consente; ruotare la password del database se è mai stata
  condivisa o committata.
- I dati personali presenti (clienti, consensi, messaggi) sono coperti dalla logica di retention:
  vedi `server/scripts/data-retention.js`.

## Checklist operativa
1. [ ] Collegare `psicomartina.it` o allineare i riferimenti al dominio in uso.
2. [ ] Abilitare Deployment Protection sulle preview.
3. [ ] Verificare/rigenerare `JWT_SECRET` e credenziali dashboard.
4. [ ] Confermare separazione `VITE_` vs variabili server.
5. [ ] Verificare SSL e backup su Neon; ruotare la password DB se necessario.
6. [ ] Pianificare l'esecuzione periodica di `data-retention.js`.
