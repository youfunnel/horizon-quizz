// =====================================================================
// CONTENU DES AUDITS PERSONNALISÉS - Horizon Finance
// ---------------------------------------------------------------------
// 5 archétypes (un par axe dominant). Chaque audit est ensuite
// personnalisé dynamiquement par buildAudit() avec :
//   - le secteur (Q1)
//   - la tranche de CA (chiffrage en euros)
//   - des observations spécifiques tirées des réponses (Q4 à Q8)
//
// Voix : calme, de pair à pair. L'émotionnel d'abord, le chiffre comme
// preuve. Pas de tirets cadratins. Pas de questions rhétoriques.
// =====================================================================

import { SECTEURS, CA_BANDS } from './quizData';

const ARCHETYPES = {
  rentabilite: {
    profil: "L'effet ciseau",
    tagline: "Vous faites plus de chiffre qu'avant. Mais il vous en reste moins.",
    constat:
      "Votre activité tourne, les clients sont là, le chiffre progresse. Et pourtant, à la fin du mois, il reste moins dans la caisse qu'avant. Ce n'est pas une impression. C'est le piège le plus fréquent entre 500K et 2M de chiffre d'affaires.",
    mecanisme:
      "Vous avez recruté pour tenir la charge. Investi dans du matériel, des véhicules, des locaux. Vos frais fixes ont grimpé. Mais vos tarifs, eux, n'ont pas suivi au même rythme. Vos coûts de croissance montent plus vite que vos marges. L'érosion est silencieuse : rien ne vous alerte, jusqu'à ce que le bilan vous la montre, plusieurs dizaines de milliers d'euros plus tard.",
  },

  tresorerie: {
    profil: 'Le pilotage au rythme des encaissements',
    tagline: "Vous faites du chiffre. Mais vous vivez au rythme des rentrées d'argent.",
    constat:
      "Vous surveillez votre compte de près. Certains mois passent, d'autres serrent. Il vous arrive de décaler une décision, un achat, un règlement, le temps qu'un encaissement tombe. Ce décalage permanent entre ce que vous facturez et ce que vous encaissez use plus que le travail lui-même.",
    mecanisme:
      "Une trésorerie tendue n'est pas toujours un problème de rentabilité. C'est souvent un problème de structure : un BFR mal calibré, des délais de paiement clients qui s'allongent, des charges fixes qui tombent avant les encaissements. Au 4e trimestre 2025, un dirigeant de TPE-PME sur trois jugeait sa trésorerie difficile. La différence se joue sur la visibilité : voir le cash arriver à 90 jours change tout.",
  },

  visibilite: {
    profil: 'La marge invisible',
    tagline: 'Vous savez que quelque chose coince. Vous ne savez pas exactement où.',
    constat:
      "Vous faites du chiffre, mais vous ne voyez pas précisément où il part. Vous ne pourriez pas dire, à un point près et sans ouvrir de fichier, quelle est votre marge nette réelle, quelle activité vous rapporte vraiment et laquelle vous coûte de l'argent.",
    mecanisme:
      "Ce flou n'est pas un manque de compétence. C'est un manque d'instrument. Votre expert-comptable fait de la conformité : il regarde en arrière, une fois par an. Personne ne vous donne la lecture en temps réel dont vous avez besoin pour piloter. Et tant que ce problème n'est pas réglé, chaque décision que vous prenez est un pari, pas un calcul.",
  },

  pricing: {
    profil: 'La sous-tarification silencieuse',
    tagline: 'Vos coûts ont changé de taille. Vos prix sont restés au même endroit.',
    constat:
      "Votre structure de coûts a évolué avec votre croissance. Vos tarifs, eux, n'ont pas été recalibrés au même rythme. Vous travaillez plus, vous facturez plus, mais chaque prestation vous laisse une marge plus fine qu'avant, sans que rien ne le signale.",
    mecanisme:
      "Une marge par activité jamais analysée et des tarifs jamais révisés : ce sont les deux postes où se logent le plus souvent les points de marge perdus. Quelques pourcents de tarif, placés sur les bonnes activités, changent l'équation sans toucher au volume. Encore faut-il savoir lesquelles portent vraiment votre rentabilité.",
  },

  decision: {
    profil: 'La décision gelée',
    tagline: "Vous savez où aller. Vous n'avez pas les chiffres pour vous lancer sereinement.",
    constat:
      "Il y a une décision que vous repoussez depuis des mois. Pas par manque de courage. Par manque de certitude. Vous savez que c'est la bonne direction, mais vous ne pouvez pas chiffrer le risque, ni dire à partir de quel mois et à quel coût vous lancer.",
    mecanisme:
      "Ce n'est pas un problème de courage. C'est un problème de lisibilité financière. Tant que vous ne pouvez pas dire \u00ab à partir de tel mois, à tel coût, voilà l'impact \u00bb, vous attendez. Et chaque mois d'attente a un coût lui aussi invisible : un recrutement non fait, un palier non franchi, une opportunité qui passe.",
  },
};

// Nuances de constat selon le secteur (ajoutées si pertinent).
const SECTEUR_TOUCH = {
  btp: "Dans le BTP, entre les chantiers qui s'étalent, les avances de matériaux et les paiements qui traînent, l'écart entre le chiffre signé et le cash réellement disponible est particulièrement large.",
  sante:
    "Dans le médical et le paramédical, la croissance passe souvent par l'embauche et l'équipement avant que les revenus ne suivent, ce qui crée exactement ce type de décalage.",
  cvc: "En plomberie, chauffage et CVC, les véhicules, le stock et la main-d'œuvre pèsent lourd dans les frais fixes, et c'est souvent là que la marge se dilue sans qu'on la voie.",
  signaletique:
    "En signalétique et dans l'industrie, le poids du matériel, des matières et des délais de production fait que chaque point de marge mal piloté coûte vite plusieurs milliers d'euros.",
  chr: "Dans la restauration et l'hôtellerie, le poids du loyer, du personnel et de l'énergie, combiné à des marges serrées et à la saisonnalité, fait que quelques points de marge mal pilotés changent tout sur un exercice.",
  autre:
    "Sur un business de services physique, avec des charges réelles et une équipe, c'est exactement ce type d'angle mort qui se creuse quand l'entreprise change de taille.",
};

// Observations spécifiques tirées des réponses (max 4 affichées).
function buildObservations(answers) {
  const obs = [];

  if (answers.marge_connue === 'non') {
    obs.push(
      "Vous ne connaissez pas votre marge nette à un point près. C'est le tout premier angle mort à lever : on ne pilote pas ce qu'on ne mesure pas."
    );
  } else if (answers.marge_connue === 'apeupres') {
    obs.push(
      "Vous avez une idée de votre marge, mais pas au point près. C'est souvent dans cet écart \u00ab à peu près \u00bb que se cachent les points perdus."
    );
  }

  if (answers.tresorerie_etat === 'soustension') {
    obs.push(
      "Votre trésorerie est sous tension quasi permanente. Un prévisionnel à 90 jours transformerait ce stress de fin de mois en décisions anticipées."
    );
  } else if (answers.tresorerie_etat === 'tendue') {
    obs.push(
      "Votre trésorerie passe mais reste tendue certains mois. C'est le signal d'un BFR ou de délais d'encaissement à recalibrer."
    );
  } else if (answers.tresorerie_etat === 'pasvisi') {
    obs.push(
      "Vous n'avez pas de visibilité claire sur votre trésorerie. C'est précisément ce point aveugle qui rend chaque engagement plus risqué qu'il ne devrait l'être."
    );
  }

  if (answers.tarifs === 'plus2' || answers.tarifs === 'jamais') {
    obs.push(
      "Vos tarifs n'ont pas bougé depuis longtemps, alors que vos coûts, eux, ont changé de taille. L'écart se paie en marge, chaque prestation."
    );
  }

  if (answers.pilotage === 'bilan') {
    obs.push(
      "Votre seule lecture financière, c'est le bilan annuel. Un rétroviseur, là où il vous faudrait un pare-brise pour décider en temps réel."
    );
  } else if (answers.pilotage === 'banque') {
    obs.push(
      "Vous pilotez au solde bancaire. Il vous dit ce qui reste, jamais ce qui crée ou détruit de la valeur dans votre activité."
    );
  }

  if (answers.decision_repoussee && answers.decision_repoussee !== 'non') {
    const map = {
      recrutement: 'un recrutement',
      investissement: 'un investissement',
      restructuration: 'une restructuration',
      plusieurs: 'plusieurs décisions',
    };
    const quoi = map[answers.decision_repoussee] || 'une décision importante';
    obs.push(
      `Vous repoussez ${quoi} faute de visibilité. Cette décision en attente a déjà un coût, même s'il ne se voit pas encore dans vos comptes.`
    );
  }

  return obs.slice(0, 4);
}

// Les 3 piliers de la méthode, formulés pour répondre à l'axe dominant.
function buildMethode(axis) {
  const accent = {
    rentabilite: "On part à la chasse aux points de marge perdus, poste par poste.",
    tresorerie: "On sécurise d'abord la trésorerie et la visibilité sur le cash.",
    visibilite: "On vous rend la lecture exacte de vos chiffres, en temps réel.",
    pricing: "On recalibre les tarifs et les marges sur les bonnes activités.",
    decision: "On transforme la décision que vous repoussez en calcul clair.",
  };

  return {
    accroche: accent[axis] || accent.visibilite,
    piliers: [
      {
        titre: 'Audit de rentabilité réelle',
        texte:
          'Marges par activité, coûts réels, point mort, BFR. On voit précisément où votre argent part et où il devrait rester.',
      },
      {
        titre: 'Tableau de bord décisionnel',
        texte:
          "Pas un reporting comptable. Un outil de pilotage qui répond en temps réel à : est-ce que je peux recruter, à quel coût, à partir de quand.",
      },
      {
        titre: "Plan d'optimisation",
        texte:
          "Ajustement de tarifs, optimisation des coûts, restructuration si nécessaire. Chaque ajustement est chiffré, mesuré, validé.",
      },
    ],
  };
}

// =====================================================================
// BUILDER PRINCIPAL
// =====================================================================
export function buildAudit(answers, dominant) {
  const base = ARCHETYPES[dominant] || ARCHETYPES.visibilite;
  const secteurLabel = SECTEURS[answers.secteur] || 'votre secteur';
  const caBand = CA_BANDS[answers.ca] || CA_BANDS['500_1m'];
  const isBelowTarget = caBand.fit === 'bas';

  return {
    axis: dominant,
    profil: base.profil,
    tagline: base.tagline,
    secteurLabel,
    caLabel: caBand.label,
    constat: base.constat,
    secteurTouch: SECTEUR_TOUCH[answers.secteur] || SECTEUR_TOUCH.autre,
    mecanisme: base.mecanisme,
    // Chiffrage : fourchette de gain pour 3 à 5 points de marge récupérés.
    chiffrageMontant: caBand.gain,
    chiffragePhrase: isBelowTarget
      ? `Sur votre niveau d'activité, récupérer 3 à 5 points de marge représente déjà ${caBand.gain} par an. L'accompagnement est calibré pour les entreprises à partir de 500K€, mais le mécanisme est le même.`
      : `Sur votre tranche de chiffre d'affaires, récupérer 3 à 5 points de marge représente ${caBand.gain} par an. Pas en travaillant plus. En pilotant mieux.`,
    observations: buildObservations(answers),
    methode: buildMethode(dominant),
  };
}
