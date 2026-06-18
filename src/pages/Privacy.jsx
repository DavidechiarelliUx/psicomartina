import React from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { getCanonicalUrl, seoPages } from "@/config/seo";

const studioEmail = import.meta.env.VITE_STUDIO_EMAIL;
const studioPhone = import.meta.env.VITE_STUDIO_PHONE;
const studioAddress = import.meta.env.VITE_STUDIO_ADDRESS || "Via Cairo Montenotte 55, Roma";
const studioVat = import.meta.env.VITE_STUDIO_VAT || "12345678901";
const alboNumber = import.meta.env.VITE_STUDIO_ALBO_NUMBER || "12345";
const alboRegion = import.meta.env.VITE_STUDIO_ALBO_REGION || "Lazio";

export default function Privacy() {
  return (
    <div className="pt-24 md:pt-28 pb-20 md:pb-28 px-5 md:px-8">
      <SEOHead {...seoPages.privacy} canonical={getCanonicalUrl(seoPages.privacy.path)} />
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-hero-sm md:text-display font-semibold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <p>
            La presente informativa è resa ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (di seguito "GDPR") a
            tutte le persone (di seguito "Interessati") che interagiscono con questo sito e con lo studio professionale. La
            consultazione di questo sito e l'utilizzo dei moduli di contatto e prenotazione comportano il trattamento di dati
            personali secondo i principi di liceità, correttezza, trasparenza e minimizzazione.
          </p>

          <h2>1. Titolare del Trattamento</h2>
          <p>
            Dott.ssa Martina Giovinazzo, Psicologa e Psicoterapeuta — Iscrizione all'Albo degli Psicologi del {alboRegion} n.{" "}
            {alboNumber}.
            <br />
            Sede: {studioAddress}
            <br />
            P.IVA: {studioVat}
            <br />
            Email: <a href={`mailto:${studioEmail}`}>{studioEmail}</a> — Tel: {studioPhone}
            <br />
            PEC: <strong>[DA INSERIRE: indirizzo PEC del Titolare]</strong>
          </p>

          <h2>2. Responsabile della Protezione dei Dati (DPO)</h2>
          <p>
            Il Titolare non è tenuto alla nomina di un Responsabile della Protezione dei Dati. <strong>[Se nominato, indicare qui
            nome e contatti del DPO; in caso contrario questa sezione può essere rimossa.]</strong> Per ogni richiesta in materia
            di privacy è possibile rivolgersi direttamente al Titolare ai recapiti sopra indicati.
          </p>

          <h2>3. Tipologie di dati trattati</h2>
          <ul>
            <li>
              <strong>Dati anagrafici e di contatto:</strong> nome, cognome, email, numero di telefono, e — per la
              sottoscrizione del consenso informato — codice fiscale, luogo e data di nascita, indirizzo di residenza.
            </li>
            <li>
              <strong>Dati relativi a minori e a persone sotto tutela:</strong> dati del minore/assistito e dell'esercente la
              responsabilità genitoriale o del tutore, conferiti da quest'ultimo.
            </li>
            <li>
              <strong>Categorie particolari di dati (art. 9 GDPR):</strong> nell'ambito della prestazione professionale possono
              essere trattati dati relativi alla salute e allo stato psicologico dell'Interessato. Ti invitiamo a{" "}
              <strong>non inserire dati sanitari o informazioni cliniche delicate nel campo note dei moduli online</strong>: tali
              aspetti verranno raccolti nel contesto protetto della relazione professionale.
            </li>
            <li>
              <strong>Dati di navigazione:</strong> dati tecnici raccolti automaticamente (es. indirizzo IP, log) e, previo
              consenso, dati statistici aggregati. Per i cookie consulta la{" "}
              <Link to="/cookie-policy">Cookie Policy</Link>.
            </li>
          </ul>

          <h2>4. Finalità e basi giuridiche del trattamento</h2>
          <ul>
            <li>
              Gestione delle richieste di contatto e prenotazione degli appuntamenti — base giuridica: misure precontrattuali e
              esecuzione del contratto (art. 6.1.b GDPR).
            </li>
            <li>
              Erogazione della prestazione psicologica/psicoterapeutica e trattamento dei dati sanitari connessi — base
              giuridica: finalità di assistenza sanitaria e cura prestate da un professionista soggetto al segreto professionale
              (art. 9.2.h GDPR) e, ove necessario, consenso esplicito dell'Interessato (art. 9.2.a GDPR).
            </li>
            <li>
              Adempimento di obblighi legali, fiscali e deontologici (es. fatturazione, conservazione documentale) — base
              giuridica: obbligo legale (art. 6.1.c GDPR).
            </li>
            <li>
              Analisi statistica aggregata della navigazione tramite strumenti di terze parti — base giuridica: consenso
              dell'Interessato (art. 6.1.a GDPR), revocabile in qualsiasi momento.
            </li>
            <li>
              Eventuale accertamento, esercizio o difesa di un diritto in sede giudiziaria — base giuridica: legittimo interesse
              del Titolare (art. 6.1.f) e art. 9.2.f GDPR.
            </li>
          </ul>

          <h2>5. Natura del conferimento</h2>
          <p>
            Il conferimento dei dati contrassegnati come obbligatori nei moduli è necessario per dar seguito alla richiesta: il
            mancato conferimento rende impossibile la gestione dell'appuntamento e l'erogazione del servizio. Il conferimento dei
            dati per finalità statistiche è facoltativo.
          </p>

          <h2>6. Destinatari e responsabili esterni del trattamento</h2>
          <p>
            I dati possono essere trattati, per conto del Titolare, da fornitori di servizi nominati Responsabili del trattamento
            ai sensi dell'art. 28 GDPR. In particolare:
          </p>
          <ul>
            <li>
              <strong>Vercel Inc.</strong> — hosting del sito e funzioni applicative (con misurazione facoltativa delle
              prestazioni "Speed Insights").
            </li>
            <li>
              <strong>Neon Inc.</strong> — servizio di database su cui sono conservati i dati di contatto, prenotazione e
              consenso.
            </li>
            <li>
              <strong>Cloudinary Ltd.</strong> — archiviazione dei documenti di consenso informato in modalità ad accesso
              riservato e dei contenuti multimediali del sito.
            </li>
            <li>
              <strong>Fornitore di posta elettronica/SMTP</strong> — invio delle email transazionali (conferme, comunicazioni di
              servizio). <strong>[DA INSERIRE: nome del provider email utilizzato]</strong>.
            </li>
            <li>
              <strong>Google Ireland Ltd.</strong> — visualizzazione facoltativa della mappa dello studio (Google Maps), attivata
              solo previo consenso.
            </li>
          </ul>
          <p>
            I dati non sono diffusi né ceduti a terzi per finalità promozionali. Possono essere comunicati ad autorità o soggetti
            pubblici quando previsto dalla legge.
          </p>

          <h2>7. Trasferimento dei dati extra-UE</h2>
          <p>
            Alcuni dei fornitori sopra indicati possono trattare dati anche al di fuori dello Spazio Economico Europeo. Tali
            trasferimenti avvengono nel rispetto degli artt. 44 e seguenti del GDPR, sulla base di garanzie adeguate quali le
            Clausole Contrattuali Standard approvate dalla Commissione Europea e/o l'adesione al Data Privacy Framework UE-USA.
          </p>

          <h2>8. Periodo di conservazione</h2>
          <ul>
            <li>
              Dati relativi a semplici richieste di contatto non seguite da un rapporto professionale: conservati per il tempo
              necessario a evadere la richiesta e comunque non oltre 24 mesi dall'ultimo contatto.
            </li>
            <li>
              Documentazione clinica e dati sanitari connessi alla prestazione professionale: conservati secondo gli obblighi di
              legge e le indicazioni deontologiche applicabili agli psicologi. <strong>[DA CONFERMARE con il proprio consulente
              il termine specifico applicabile, di norma alcuni anni dalla conclusione del rapporto.]</strong>
            </li>
            <li>Documenti contabili e fiscali: conservati per 10 anni come previsto dalla normativa fiscale.</li>
          </ul>

          <h2>9. Dati relativi ai minori</h2>
          <p>
            I dati dei minori sono trattati esclusivamente con il consenso e l'intervento dell'esercente la responsabilità
            genitoriale o del tutore, che garantisce la titolarità a fornire tali dati. Lo studio adotta particolari cautele nel
            trattamento di tali informazioni.
          </p>

          <h2>10. Diritti dell'Interessato</h2>
          <p>Ai sensi degli articoli 15-22 del GDPR, l'Interessato ha diritto di:</p>
          <ul>
            <li>accedere ai propri dati personali e ottenerne copia;</li>
            <li>richiedere la rettifica o la cancellazione;</li>
            <li>ottenere la limitazione del trattamento;</li>
            <li>opporsi al trattamento;</li>
            <li>richiedere la portabilità dei dati;</li>
            <li>revocare in qualsiasi momento il consenso prestato, senza pregiudicare la liceità del trattamento precedente.</li>
          </ul>
          <p>
            Le richieste vanno indirizzate al Titolare all'indirizzo <a href={`mailto:${studioEmail}`}>{studioEmail}</a>. Il
            Titolare risponde senza ingiustificato ritardo e comunque entro un mese.
          </p>

          <h2>11. Reclamo all'Autorità di controllo</h2>
          <p>
            L'Interessato che ritenga che il trattamento dei propri dati avvenga in violazione del GDPR ha diritto di proporre
            reclamo al Garante per la protezione dei dati personali (
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              www.garanteprivacy.it
            </a>
            ) o all'autorità di controllo dello Stato membro di residenza.
          </p>

          <h2>12. Cookie</h2>
          <p>
            Questo sito utilizza cookie tecnici necessari e, previo consenso, cookie analitici e contenuti di terze parti. Per i
            dettagli e per gestire o revocare le preferenze consulta la <Link to="/cookie-policy">Cookie Policy</Link>.
          </p>

          <h2>13. Modifiche alla presente informativa</h2>
          <p>
            Il Titolare si riserva di aggiornare la presente informativa. Le modifiche saranno pubblicate su questa pagina con
            indicazione della data di ultimo aggiornamento.
          </p>

          <p className="text-sm mt-8">Ultimo aggiornamento: Giugno 2026</p>
        </div>
      </div>
    </div>
  );
}
