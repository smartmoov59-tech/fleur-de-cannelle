/* ==========================================================================
   Réglages de la boutique — à modifier ici, rien d'autre à toucher.
   ========================================================================== */
window.FC_CONFIG = {
  shop: 'Fleur de cannelle · Floralova',
  address: 'Bd Montesquieu, 13320 Bouc-Bel-Air',
  phoneDisplay: '04 42 22 68 53',
  phoneTel: '+33442226853',
  instagram: 'floralova.cannelle',

  /* ----- Pour que la demande de réservation parte en UN geste -----
     Le 04 42 22 68 53 est un numéro fixe : il ne reçoit pas les SMS.
     Dès que la boutique donne un portable, une adresse e-mail ou un WhatsApp,
     renseigner ci-dessous : les boutons correspondants apparaissent tout seuls
     dans la confirmation (rien d'autre à modifier, aucun abonnement nécessaire). */
  smsNumber: '',   // ex. '+33612345678'
  whatsapp: '',    // ex. '33612345678' (indicatif sans le +)
  email: '',       // ex. 'contact@fleurdecannelle.fr'

  /* ----- Horaires (source : fiche Google Maps, novembre 2026) -----
     0 = dimanche … 6 = samedi.  [] = fermé.  null = horaires non confirmés (on invite à appeler). */
  hours: {
    0: [['10:00', '12:30']],
    1: [],
    2: [['09:30', '12:30'], ['15:30', '19:00']],
    3: null, // mercredi : à confirmer auprès de la boutique
    4: [['15:30', '19:00']],
    5: [['09:30', '19:00']],
    6: [['09:00', '19:00']]
  },
  holidays: ['2026-11-11', '2026-12-25', '2027-01-01', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-08'],
  bookingDays: 28,     // fenêtre de réservation (jours à partir d'aujourd'hui)
  slotMinutes: 30
};
