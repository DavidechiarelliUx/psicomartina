import React from "react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { getCanonicalUrl, seoPages } from "@/config/seo";
import { useConsent } from "@/lib/consent";

const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;

export default function CookiePolicy() {
  const { openPreferences } = useConsent();

  return (
    <div className="pt-24 md:pt-28 pb-20 md:pb-28 px-5 md:px-8">
      <SEOHead {...seoPages.cookiePolicy} canonical={getCanonicalUrl(seoPages.cookiePolicy.path)} />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-8">Cookie Policy</h1>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <p>
            Questa Cookie Policy spiega cosa sono i cookie, quali vengono utilizzati su questo sito, con quali finalità e come
            puoi gestire le tue preferenze. È redatta in conformità al Regolamento (UE) 2016/679 (GDPR) e alle Linee guida del
            Garante per la protezione dei dati personali sull'uso dei cookie (provvedimento del 10 giugno 2021).
          </p>

          <h2>Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell'utente, dove vengono memorizzati
            per essere ritrasmessi agli stessi siti alla visita successiva. Tecnologie analoghe (es. <em>localStorage</em>)
            possono essere usate per memorizzare informazioni sul dispositivo.
          </p>

          <h2>Cookie utilizzati da questo sito</h2>

          <h3>1. Cookie tecnici e di funzionamento (necessari)</h3>
          <p>
            Indispensabili per la fruizione del sito e per memorizzare le tue scelte sui cookie. Non richiedono consenso. Tra
            questi rientra la memorizzazione locale della tua preferenza sui cookie (chiave <code>cookie_consent_v2</code>) e,
            durante la navigazione autenticata dell'area riservata, il token di sessione.
          </p>
          <p>Rientrano tra i servizi tecnici/funzionali necessari al funzionamento del sito anche:</p>
          <ul>
            <li>
              <strong>Vercel</strong> — hosting e distribuzione del sito (CDN). Fornitore: Vercel Inc. (USA).{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Informativa</a>.
            </li>
            <li>
              <strong>Cloudinary</strong> — distribuzione di immagini e contenuti multimediali. Fornitore: Cloudinary Ltd.{" "}
              <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer">Informativa</a>.
            </li>
            <li>
              <strong>Google Fonts</strong> — caricamento dei font tipografici del sito. Comporta una connessione ai server di
              Google, con possibile trasferimento dell'indirizzo IP. Fornitore: Google Ireland Ltd. / Google LLC (USA).{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Informativa</a>.
            </li>
          </ul>

          <h3>2. Cookie analitici e contenuti di terze parti (facoltativi)</h3>
          <p>
            Attivati <strong>solo previo tuo consenso</strong>. Includono:
          </p>
          <ul>
            <li>
              <strong>Vercel Speed Insights</strong> — statistiche aggregate sulle prestazioni e sull'esperienza di navigazione.
              Fornitore: Vercel Inc. (USA). Finalità: misurazione e miglioramento delle performance.{" "}
              <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Informativa</a>.
            </li>
            <li>
              <strong>Google Maps</strong> — mappa interattiva per individuare lo studio, mostrata nella pagina Contatti.
              L'incorporamento della mappa comporta una connessione ai server di Google, che può installare cookie propri.
              Fornitore: Google Ireland Ltd. / Google LLC (USA).{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Informativa</a>.
            </li>
          </ul>
          <p>
            Finché non presti il consenso, questi strumenti <strong>non vengono caricati</strong> e la mappa è sostituita da un
            segnaposto.
          </p>

          <h2>Trasferimento dei dati extra-UE</h2>
          <p>
            Alcuni fornitori terzi (Vercel, Google) possono trattare dati anche al di fuori dell'Unione Europea. Tali
            trasferimenti avvengono sulla base delle garanzie previste dagli artt. 44 e ss. del GDPR (es. Clausole Contrattuali
            Standard e/o adesione al Data Privacy Framework UE-USA).
          </p>

          <h2>Gestione e revoca del consenso</h2>
          <p>
            Puoi modificare o revocare in qualsiasi momento le tue scelte sui cookie tramite il pannello delle preferenze:
          </p>
          <p>
            <Button onClick={openPreferences} className="rounded-full px-6 not-prose">
              Gestisci le preferenze cookie
            </Button>
          </p>
          <p>
            In alternativa, puoi gestire o disabilitare i cookie direttamente dalle impostazioni del tuo browser. La
            disattivazione dei cookie tecnici può compromettere il corretto funzionamento del sito.
          </p>

          <h2>Contatti</h2>
          <p>
            Per qualsiasi domanda relativa a questa Cookie Policy o al trattamento dei tuoi dati puoi scrivere a:{" "}
            <a href={`mailto:${studioEmail}`}>{studioEmail}</a>. Per maggiori informazioni sul trattamento dei dati personali
            consulta la <a href="/privacy">Privacy Policy</a>.
          </p>

          <p className="text-sm mt-8">Ultimo aggiornamento: Giugno 2026</p>
        </div>
      </div>
    </div>
  );
}
