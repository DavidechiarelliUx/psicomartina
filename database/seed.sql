-- Seed realistico per sviluppo psicomartina.
-- Usa UUID deterministici per mantenere relazioni coerenti e idempotenza.

insert into services (id, code, title, subtitle, description, display_order, active) values
('11111111-1111-4111-8111-111111111111','primo_colloquio','Primo Colloquio Conoscitivo','Il primo passo','Un incontro gratuito di 30 minuti per conoscerci, comprendere le esigenze e valutare il percorso più adatto.',1,true),
('22222222-2222-4222-8222-222222222222','ansia','Ansia e Stress','Ritrovare la calma interiore','Percorsi per riconoscere e gestire ansia, stress, panico e tensione cronica nella vita quotidiana.',2,true),
('33333333-3333-4333-8333-333333333333','relazioni','Difficoltà Relazionali','Costruire legami autentici','Supporto per comprendere dinamiche di coppia, famiglia, amicizia e confini personali.',3,true),
('44444444-4444-4444-8444-444444444444','autostima','Autostima e Identità','Riscoprire il proprio valore','Percorsi per ridurre autocritica e perfezionismo e costruire una relazione più gentile con sé.',4,true),
('55555555-5555-4555-8555-555555555555','traumi','Elaborazione dei Traumi','Guarire dalle ferite del passato','Accompagnamento delicato per rielaborare esperienze traumatiche e lutti significativi.',5,true)
on conflict (code) do update set title=excluded.title, subtitle=excluded.subtitle, description=excluded.description, display_order=excluded.display_order, active=excluded.active;

insert into service_benefits (service_id, benefit, display_order) values
('22222222-2222-4222-8222-222222222222','Attacchi di panico e ansia generalizzata',1),
('22222222-2222-4222-8222-222222222222','Ansia sociale e paura del giudizio',2),
('22222222-2222-4222-8222-222222222222','Stress lavorativo e burnout',3),
('33333333-3333-4333-8333-333333333333','Conflitti di coppia ricorrenti',1),
('33333333-3333-4333-8333-333333333333','Dipendenza affettiva',2),
('33333333-3333-4333-8333-333333333333','Difficoltà a stabilire confini sani',3),
('44444444-4444-4444-8444-444444444444','Senso di inadeguatezza cronica',1),
('44444444-4444-4444-8444-444444444444','Perfezionismo paralizzante',2),
('55555555-5555-4555-8555-555555555555','Traumi dell''infanzia e dell''attaccamento',1),
('55555555-5555-4555-8555-555555555555','Lutti e perdite significative',2)
on conflict do nothing;

insert into clients (id, full_name, email, phone, notes, created_at) values
('aaaaaaaa-0001-4000-8000-000000000001','Maria Rossi','maria.rossi@example.com','+39 333 123 4567','Preferisce sedute mattutine.', now() - interval '20 days'),
('aaaaaaaa-0002-4000-8000-000000000002','Luca Bianchi','luca.bianchi@example.com','+39 333 222 4567','Primo contatto dal sito.', now() - interval '18 days'),
('aaaaaaaa-0003-4000-8000-000000000003','Anna Verdi','anna.verdi@example.com','+39 333 333 4567','Interessata a percorso relazionale.', now() - interval '15 days'),
('aaaaaaaa-0004-4000-8000-000000000004','Giulia Neri','giulia.neri@example.com','+39 333 444 4567',null, now() - interval '12 days'),
('aaaaaaaa-0005-4000-8000-000000000005','Marco Rinaldi','marco.rinaldi@example.com','+39 333 555 4567',null, now() - interval '10 days'),
('aaaaaaaa-0006-4000-8000-000000000006','Sara Conti','sara.conti@example.com','+39 333 666 4567',null, now() - interval '9 days'),
('aaaaaaaa-0007-4000-8000-000000000007','Elena Ferri','elena.ferri@example.com','+39 333 777 4567',null, now() - interval '8 days'),
('aaaaaaaa-0008-4000-8000-000000000008','Paolo Galli','paolo.galli@example.com','+39 333 888 4567',null, now() - interval '7 days'),
('aaaaaaaa-0009-4000-8000-000000000009','Chiara De Luca','chiara.deluca@example.com','+39 333 999 4567',null, now() - interval '6 days'),
('aaaaaaaa-0010-4000-8000-000000000010','Francesca Moretti','francesca.moretti@example.com','+39 333 101 4567',null, now() - interval '5 days'),
('aaaaaaaa-0011-4000-8000-000000000011','Roberto Villa','roberto.villa@example.com','+39 333 202 4567',null, now() - interval '4 days'),
('aaaaaaaa-0012-4000-8000-000000000012','Martina Greco','martina.greco@example.com','+39 333 303 4567',null, now() - interval '3 days')
on conflict (id) do update set full_name=excluded.full_name, email=excluded.email, phone=excluded.phone, notes=excluded.notes;

insert into appointments (id, client_id, service_id, service_type, scheduled_date, time_slot, status, notes, privacy_accepted, source, created_at) values
('bbbbbbbb-0001-4000-8000-000000000001','aaaaaaaa-0001-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','ansia','2026-05-22','10:00','confirmed','Prima seduta dopo colloquio conoscitivo.',true,'website', now() - interval '12 days'),
('bbbbbbbb-0002-4000-8000-000000000002','aaaaaaaa-0002-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','primo_colloquio','2026-05-27','15:00','pending','Richiesta da form contatti.',true,'website', now() - interval '9 days'),
('bbbbbbbb-0003-4000-8000-000000000003','aaaaaaaa-0003-4000-8000-000000000003','33333333-3333-4333-8333-333333333333','relazioni','2026-06-04','17:00','confirmed','Percorso su dinamiche familiari.',true,'website', now() - interval '8 days'),
('bbbbbbbb-0004-4000-8000-000000000004','aaaaaaaa-0004-4000-8000-000000000004','44444444-4444-4444-8444-444444444444','autostima','2026-06-08','11:00','confirmed',null,true,'phone', now() - interval '7 days'),
('bbbbbbbb-0005-4000-8000-000000000005','aaaaaaaa-0005-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','ansia','2026-06-10','09:00','pending','Chiede disponibilità online.',true,'website', now() - interval '6 days'),
('bbbbbbbb-0006-4000-8000-000000000006','aaaaaaaa-0006-4000-8000-000000000006','55555555-5555-4555-8555-555555555555','traumi','2026-06-12','16:00','confirmed',null,true,'website', now() - interval '6 days'),
('bbbbbbbb-0007-4000-8000-000000000007','aaaaaaaa-0007-4000-8000-000000000007','33333333-3333-4333-8333-333333333333','relazioni','2026-06-15','12:00','cancelled','Ha chiesto di riprogrammare.',true,'email', now() - interval '5 days'),
('bbbbbbbb-0008-4000-8000-000000000008','aaaaaaaa-0008-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','primo_colloquio','2026-06-18','14:00','pending',null,true,'website', now() - interval '4 days'),
('bbbbbbbb-0009-4000-8000-000000000009','aaaaaaaa-0009-4000-8000-000000000009','44444444-4444-4444-8444-444444444444','autostima','2026-06-20','10:00','confirmed',null,true,'website', now() - interval '3 days'),
('bbbbbbbb-0010-4000-8000-000000000010','aaaaaaaa-0010-4000-8000-000000000010','22222222-2222-4222-8222-222222222222','ansia','2026-07-02','18:00','pending',null,true,'website', now() - interval '2 days'),
('bbbbbbbb-0011-4000-8000-000000000011','aaaaaaaa-0011-4000-8000-000000000011','55555555-5555-4555-8555-555555555555','traumi','2026-07-07','15:00','confirmed',null,true,'phone', now() - interval '1 day'),
('bbbbbbbb-0012-4000-8000-000000000012','aaaaaaaa-0012-4000-8000-000000000012','33333333-3333-4333-8333-333333333333','relazioni','2026-07-13','17:00','completed','Seduta conclusa con follow-up.',true,'website', now() - interval '25 days')
on conflict (id) do update set status=excluded.status, scheduled_date=excluded.scheduled_date, time_slot=excluded.time_slot, notes=excluded.notes;

insert into contact_messages (id, client_id, service_id, name, email, phone, message, status, privacy_accepted, created_at) values
('cccccccc-0001-4000-8000-000000000001','aaaaaaaa-0004-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Giulia','giulia@example.com','+39 333 444 0001','Vorrei informazioni sul primo colloquio conoscitivo.','new',true, now() - interval '2 hours'),
('cccccccc-0002-4000-8000-000000000002','aaaaaaaa-0005-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','Marco','marco@example.com','+39 333 555 0002','Sto attraversando un periodo di forte stress lavorativo.','new',true, now() - interval '4 hours'),
('cccccccc-0003-4000-8000-000000000003','aaaaaaaa-0006-4000-8000-000000000006','44444444-4444-4444-8444-444444444444','Sara','sara@example.com',null,'Vorrei capire se un percorso sull''autostima può aiutarmi.','read',true, now() - interval '1 day'),
('cccccccc-0004-4000-8000-000000000004','aaaaaaaa-0007-4000-8000-000000000007','33333333-3333-4333-8333-333333333333','Elena','elena@example.com','+39 333 777 0004','Ho difficoltà a gestire alcuni conflitti familiari.','replied',true, now() - interval '2 days'),
('cccccccc-0005-4000-8000-000000000005','aaaaaaaa-0008-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','Paolo','paolo@example.com',null,'Vorrei sapere se sono disponibili sedute online.','new',true, now() - interval '3 days'),
('cccccccc-0006-4000-8000-000000000006','aaaaaaaa-0009-4000-8000-000000000009','55555555-5555-4555-8555-555555555555','Chiara','chiara@example.com','+39 333 999 0006','Cerco supporto per elaborare una perdita recente.','read',true, now() - interval '4 days'),
('cccccccc-0007-4000-8000-000000000007','aaaaaaaa-0010-4000-8000-000000000010','22222222-2222-4222-8222-222222222222','Francesca','francesca@example.com',null,'Chiedo disponibilità per il mese prossimo.','archived',true, now() - interval '5 days'),
('cccccccc-0008-4000-8000-000000000008','aaaaaaaa-0011-4000-8000-000000000011','33333333-3333-4333-8333-333333333333','Roberto','roberto@example.com','+39 333 202 0008','Vorrei fissare una chiamata conoscitiva.','new',true, now() - interval '6 days'),
('cccccccc-0009-4000-8000-000000000009','aaaaaaaa-0012-4000-8000-000000000012','44444444-4444-4444-8444-444444444444','Martina','martina.greco@example.com','+39 333 303 0009','Vorrei informazioni sui tempi del percorso.','replied',true, now() - interval '7 days'),
('cccccccc-0010-4000-8000-000000000010',null,'11111111-1111-4111-8111-111111111111','Alessia','alessia@example.com',null,'È possibile fare il primo colloquio in videochiamata?','new',true, now() - interval '8 days')
on conflict (id) do update set status=excluded.status, message=excluded.message;

insert into testimonials (id, name, text, rating, visible, display_order) values
('dddddddd-0001-4000-8000-000000000001','Maria L.','La Dott.ssa Giovinazzo ha creato uno spazio dove finalmente mi sono sentita libera di essere me stessa. Dopo mesi di terapia, ho imparato a gestire l''ansia e a vivere con più serenità.',5,true,1),
('dddddddd-0002-4000-8000-000000000002','Marco R.','Avevo paura di iniziare un percorso psicologico, ma la delicatezza e la professionalità della Dott.ssa mi hanno fatto sentire subito a mio agio.',5,true,2),
('dddddddd-0003-4000-8000-000000000003','Sara P.','Grazie a questo percorso ho ritrovato fiducia in me stessa e nelle mie relazioni.',5,true,3),
('dddddddd-0004-4000-8000-000000000004','Luca D.','Un''esperienza trasformativa, affrontata con grande sensibilità e competenza.',5,true,4),
('dddddddd-0005-4000-8000-000000000005','Giulia F.','Ho trovato strumenti concreti per gestire meglio lo stress quotidiano.',4,true,5),
('dddddddd-0006-4000-8000-000000000006','Paola S.','Mi sono sentita ascoltata senza giudizio fin dal primo incontro.',5,true,6),
('dddddddd-0007-4000-8000-000000000007','Andrea T.','Il percorso mi ha aiutato a comunicare meglio nelle mie relazioni.',5,true,7),
('dddddddd-0008-4000-8000-000000000008','Francesca B.','Un accompagnamento rispettoso dei miei tempi e delle mie difficoltà.',5,true,8),
('dddddddd-0009-4000-8000-000000000009','Elisa C.','Ho imparato a riconoscere i segnali dell''ansia prima che diventassero travolgenti.',4,true,9),
('dddddddd-0010-4000-8000-000000000010','Roberta M.','La terapia mi ha aiutata a riprendere fiducia nelle mie decisioni.',5,true,10)
on conflict (id) do update set text=excluded.text, rating=excluded.rating, visible=excluded.visible, display_order=excluded.display_order;

insert into blog_posts (id, service_id, title, slug, excerpt, content, category, cover_image, published, reading_time, published_at) values
('eeeeeeee-0001-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','Ansia e respiro: piccoli gesti per ritrovare presenza','ansia-respiro-consapevole','Alcune pratiche semplici per riconoscere i segnali dell''ansia e tornare gradualmente al corpo.','L''ansia non è un nemico da combattere, ma un segnale da ascoltare. Un primo passo utile è rallentare il respiro e osservare ciò che accade senza giudizio.','ansia','/images/blog-cover.png',true,5,'2026-01-15 09:00:00+01'),
('eeeeeeee-0002-4000-8000-000000000002','33333333-3333-4333-8333-333333333333','Confini nelle relazioni: dire no senza perdere contatto','confini-relazioni','Imparare a mettere confini chiari è un atto di cura verso di sé e verso gli altri.','I confini non servono a creare distanza, ma a rendere possibile una vicinanza più autentica. Dire no può diventare un gesto di chiarezza.','relazioni','/images/blog-cover.png',true,6,'2026-02-10 09:00:00+01'),
('eeeeeeee-0003-4000-8000-000000000003','44444444-4444-4444-8444-444444444444','Autostima e gentilezza verso di sé','autostima-gentilezza','L''autostima cresce anche nel modo in cui impariamo a parlarci nei momenti difficili.','Allenare una voce interna più gentile non significa giustificare tutto, ma creare le condizioni per cambiare senza ferirsi.','autostima','/images/blog-cover.png',true,4,'2026-03-05 09:00:00+01'),
('eeeeeeee-0004-4000-8000-000000000004','55555555-5555-4555-8555-555555555555','Trauma e sicurezza: ricostruire fiducia passo dopo passo','trauma-sicurezza','Un percorso sul trauma parte dal recupero di sicurezza e stabilità.','La rielaborazione del trauma richiede gradualità, rispetto dei tempi e strumenti per ritrovare radicamento nel presente.','traumi','/images/blog-cover.png',true,7,'2026-04-02 09:00:00+02'),
('eeeeeeee-0005-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','Stress lavorativo: quando fermarsi diventa necessario','stress-lavorativo','Segnali da osservare quando il lavoro invade il benessere personale.','Il corpo spesso anticipa ciò che la mente fatica ad ammettere. Tensione, insonnia e irritabilità possono indicare il bisogno di ricalibrare i ritmi.','ansia','/images/blog-cover.png',true,5,'2026-04-20 09:00:00+02'),
('eeeeeeee-0006-4000-8000-000000000006','33333333-3333-4333-8333-333333333333','Comunicazione assertiva nelle relazioni importanti','comunicazione-assertiva','Parlare con chiarezza senza perdere empatia è una competenza allenabile.','L''assertività permette di esprimere bisogni e limiti restando in relazione. È una pratica fatta di ascolto, parole semplici e coerenza.','relazioni','/images/blog-cover.png',true,6,'2026-05-05 09:00:00+02'),
('eeeeeeee-0007-4000-8000-000000000007','44444444-4444-4444-8444-444444444444','Perfezionismo: quando il controllo diventa fatica','perfezionismo-controllo','Riconoscere il perfezionismo come strategia di protezione.','Il perfezionismo può dare l''illusione di sicurezza, ma spesso aumenta paura e immobilità. Imparare a tollerare l''imperfezione apre nuove possibilità.','autostima','/images/blog-cover.png',true,5,'2026-05-12 09:00:00+02'),
('eeeeeeee-0008-4000-8000-000000000008','11111111-1111-4111-8111-111111111111','Come prepararsi al primo colloquio psicologico','primo-colloquio-psicologico','Cosa aspettarsi dal primo incontro e come arrivarci con più serenità.','Il primo colloquio serve a conoscersi, chiarire il bisogno e valutare insieme se iniziare un percorso. Non servono risposte pronte.','primo_colloquio','/images/blog-cover.png',true,4,'2026-05-18 09:00:00+02'),
('eeeeeeee-0009-4000-8000-000000000009','55555555-5555-4555-8555-555555555555','Lutto: dare spazio a ciò che cambia','lutto-spazio-cambia','Il lutto richiede tempo, presenza e rispetto per il proprio modo di attraversarlo.','Ogni perdita modifica il paesaggio interno. Accompagnare il lutto significa creare spazio per dolore, memoria e nuovi equilibri.','traumi','/images/blog-cover.png',false,6,'2026-06-01 09:00:00+02'),
('eeeeeeee-0010-4000-8000-000000000010','22222222-2222-4222-8222-222222222222','Dormire meglio quando la mente corre','insonnia-mente-corre','Piccole strategie per ridurre la ruminazione serale.','Routine stabili, decompressione graduale e ascolto corporeo possono aiutare a ridurre l''attivazione serale.','ansia','/images/blog-cover.png',true,5,'2026-05-19 09:00:00+02')
on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, content=excluded.content, category=excluded.category, cover_image=excluded.cover_image, published=excluded.published, reading_time=excluded.reading_time, published_at=excluded.published_at;
