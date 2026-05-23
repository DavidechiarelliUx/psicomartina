import React from "react";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
const studioPhone = import.meta.env.VITE_STUDIO_PHONE;

export default function Privacy() {
  return (
    <div className="pt-24 md:pt-28 pb-20 md:pb-28 px-5 md:px-8">
      <SEOHead {...seoPages.privacy} canonical={getCanonicalUrl(seoPages.privacy.path)} />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <h2>Titolare del Trattamento</h2>
          <p>
            Dott.ssa Martina Giovinazzo — Via della Serenità 42, 00100 Roma (RM)
            <br />
            Email: {studioEmail} — Tel: {studioPhone}
            <br />
            P.IVA: 12345678901
          </p>

          <h2>Tipologia di dati raccolti</h2>
          <p>
            Tra i dati personali raccolti da questo sito, in modo autonomo o tramite terze parti, ci sono: nome, cognome, email, numero di telefono, dati di
            navigazione (cookie tecnici e analitici).
          </p>

          <h2>Finalità del trattamento</h2>
          <p>I dati dell'utente sono raccolti per le seguenti finalità:</p>
          <ul>
            <li>Gestione delle richieste di contatto e prenotazione appuntamenti</li>
            <li>Comunicazioni relative al servizio richiesto</li>
            <li>Adempimento di obblighi legali e fiscali</li>
            <li>Analisi statistica anonima della navigazione (con consenso)</li>
          </ul>

          <h2>Base giuridica del trattamento</h2>
          <p>
            Il trattamento dei dati è basato sul consenso dell'interessato (art. 6, par. 1, lett. a, GDPR), sull'esecuzione di un contratto (art. 6, par. 1,
            lett. b) e su obblighi legali (art. 6, par. 1, lett. c).
          </p>

          <h2>Conservazione dei dati</h2>
          <p>
            I dati personali saranno conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti. In ogni caso, non oltre 24 mesi
            dall'ultimo contatto.
          </p>

          <h2>Diritti dell'interessato</h2>
          <p>Ai sensi degli articoli 15-22 del GDPR, l'utente ha diritto di:</p>
          <ul>
            <li>Accedere ai propri dati personali</li>
            <li>Richiedere la rettifica o la cancellazione</li>
            <li>Limitare il trattamento</li>
            <li>Opporsi al trattamento</li>
            <li>Richiedere la portabilità dei dati</li>
            <li>Revocare il consenso in qualsiasi momento</li>
          </ul>

          <h2>Cookie</h2>
          <p>
            Questo sito utilizza cookie tecnici necessari per il funzionamento e, con il consenso dell'utente, cookie analitici per migliorare l'esperienza di
            navigazione. È possibile gestire le preferenze sui cookie in qualsiasi momento.
          </p>

          <h2>Contatti</h2>
          <p>
            Per esercitare i tuoi diritti o per qualsiasi domanda relativa al trattamento dei tuoi dati, puoi scrivere a:{" "}
            <a href={`mailto:${studioEmail}`}>{studioEmail}</a>
          </p>

          <p className="text-sm mt-8">Ultimo aggiornamento: Maggio 2026</p>
        </div>
      </div>
    </div>
  );
}
