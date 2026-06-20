import React from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
const studioPhone = import.meta.env.VITE_STUDIO_PHONE;
const studioAddress = import.meta.env.VITE_STUDIO_ADDRESS || "Via Tricerro 100, Roma";
const studioVat = import.meta.env.VITE_STUDIO_VAT || "18477451001";
const alboNumber = import.meta.env.VITE_STUDIO_ALBO_NUMBER || "32977";
const alboRegion = import.meta.env.VITE_STUDIO_ALBO_REGION || "Lazio";

export default function LegalNotice() {
  return (
    <div className="pt-24 md:pt-28 pb-20 md:pb-28 px-5 md:px-8">
      <SEOHead {...seoPages.legalNotice} canonical={getCanonicalUrl(seoPages.legalNotice.path)} />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-8">Note Legali e Termini</h1>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          {/* Disclaimer professionale e gestione emergenze, in evidenza */}
          <div className="not-prose mb-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm font-semibold text-foreground mb-2">Avviso importante — Emergenze</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Questo sito e i servizi offerti <strong>non sono adatti a situazioni di emergenza o urgenza</strong>. In caso di
              pericolo immediato per te o per altri, o di pensieri di farti del male, contatta subito il <strong>112</strong>{" "}
              (Numero Unico Emergenze) o recati al Pronto Soccorso più vicino. Per un supporto immediato puoi anche rivolgerti a
              Telefono Amico Italia (<strong>02 2327 2327</strong>) o al Servizio per la prevenzione del suicidio
              (<strong>800 833 833</strong>).
            </p>
          </div>

          <h2>1. Titolare del sito</h2>
          <p>
            Dott.ssa Martina Giovinazzo, Psicologa — Iscrizione all'Albo degli Psicologi del {alboRegion} n.{" "}
            {alboNumber}.
            <br />
            Sede: {studioAddress} — P.IVA: {studioVat}
            <br />
            Email: <a href={`mailto:${studioEmail}`}>{studioEmail}</a> — Tel: {studioPhone}
          </p>

          <h2>2. Natura delle prestazioni e dei contenuti</h2>
          <p>
            Le prestazioni offerte sono di natura psicologica e vengono erogate nel rispetto del Codice
            Deontologico degli Psicologi italiani. I contenuti pubblicati su questo sito (articoli del blog, descrizioni dei
            servizi, materiali informativi) hanno <strong>finalità esclusivamente informativa e divulgativa</strong> e{" "}
            <strong>non costituiscono diagnosi, terapia, parere clinico o prescrizione</strong>. La lettura dei contenuti non
            instaura alcun rapporto professionale e non sostituisce un consulto individuale con un professionista qualificato.
          </p>

          <h2>3. Nessuna diagnosi o terapia a distanza tramite il sito</h2>
          <p>
            La compilazione dei moduli di contatto e prenotazione ha l'unico scopo di richiedere un appuntamento. Nessuna
            valutazione clinica, diagnosi o intervento terapeutico viene effettuato tramite il sito o via email. Ogni percorso
            professionale viene definito esclusivamente nell'ambito della relazione diretta tra professionista e cliente.
          </p>

          <h2>4. Prenotazioni, appuntamenti e disdette</h2>
          <p>
            La richiesta di appuntamento inviata tramite il sito costituisce una proposta che si perfeziona solo con la conferma
            da parte dello studio. Per disdette o riprogrammazioni si invita a dare comunicazione con ragionevole anticipo ai
            recapiti indicati. <strong>[DA PERSONALIZZARE: eventuale policy di disdetta, preavviso minimo ed eventuali costi.]</strong>
          </p>

          <h2>5. Proprietà intellettuale</h2>
          <p>
            Tutti i contenuti del sito (testi, immagini, logo, grafica, marchi) sono di proprietà del Titolare o utilizzati su
            licenza e sono protetti dalle norme sul diritto d'autore. È vietata la riproduzione, anche parziale, senza
            autorizzazione scritta.
          </p>

          <h2>6. Limitazione di responsabilità</h2>
          <p>
            Il Titolare cura i contenuti con la massima diligenza ma non garantisce che siano sempre completi, aggiornati o privi
            di errori, e non risponde di eventuali decisioni assunte dall'utente sulla base delle sole informazioni reperite sul
            sito. Il Titolare non è responsabile per interruzioni del servizio dovute a cause tecniche o a fornitori terzi.
          </p>

          <h2>7. Link a siti esterni</h2>
          <p>
            Il sito può contenere collegamenti a siti di terze parti. Il Titolare non controlla tali siti e non è responsabile
            dei loro contenuti o delle loro politiche sulla privacy.
          </p>

          <h2>8. Trattamento dei dati e cookie</h2>
          <p>
            Le modalità di trattamento dei dati personali e l'uso dei cookie sono descritti nella{" "}
            <Link to="/privacy">Privacy Policy</Link> e nella <Link to="/cookie-policy">Cookie Policy</Link>.
          </p>

          <h2>9. Legge applicabile e foro competente</h2>
          <p>
            I presenti termini sono regolati dalla legge italiana. Per le controversie con i consumatori è competente il foro del
            luogo di residenza o domicilio del consumatore. Resta ferma la possibilità di ricorrere agli strumenti di
            risoluzione alternativa delle controversie previsti dalla normativa vigente.
          </p>

          <h2>10. Modifiche</h2>
          <p>
            Il Titolare si riserva di modificare in qualsiasi momento le presenti Note Legali. Le modifiche hanno effetto dalla
            pubblicazione su questa pagina.
          </p>

          <p className="text-sm mt-8">Ultimo aggiornamento: Giugno 2026</p>
        </div>
      </div>
    </div>
  );
}
