# Idées de Beau (01/10) — tri et état

Légende : ✅ fait · 🔨 en cours · 🔜 prévu (sans base, gratuit) · 🧩 demande la base commune (SQL à Alpha d'abord) · 💶 coûte de l'argent (accord de Beau avant) · 🤝 dépend de la place de marché / d'Alpha · ⚠️ reformulé ou écarté (raison dite).

Règles qui filtrent : aucun chiffre ou diplôme inventé, aucune affiliation à une université, aucune dépense sans accord, pas de lecture des tables des autres apps, clé IA côté fonction edge seulement, Finjaro mondial.

## Liste des 100 idées

### Cours d'excellence (1–15)
| # | Idée | État |
|---|---|---|
| 1 | Algorithmique avancée, structures complexes | ✅ en partie (14 leçons) · 🔜 suite : tas, arbres, Dijkstra, programmation dynamique |
| 2 | Architecture des ordinateurs | ✅ piste « Ordinateurs » (02/10) : 7 leçons (NAND, XOR, additionneur, n bits, complément à deux, UAL, mini-processeur) |
| 3 | Maths pour le machine learning | ✅ piste « Maths pour l'IA » (01/10) : 10 leçons (vecteurs, cosinus, matrices, dérivée, gradient, moyenne/variance, Bayes, espérance, entropie, softmax) · 🔜 PCA |
| 4 | Théorie de l'information, cryptographie | ✅ entropie + piste « Cryptographie » (02/10) : 8 leçons (César, Vigenère, fréquences, hachage, PGCD, exponentiation, RSA jouet, Diffie–Hellman) ; jouets, jamais pour de vraies données |
| 5 | Systèmes distribués | 🔜 simulations en Python (réplication, consensus simplifié) |
| 6 | Informatique quantique | 🔜 piste « Quantique » : qubits simulés avec NumPy (Hadamard, intrication, Grover) |
| 7 | Neurosciences computationnelles | 🔜 neurone à impulsions (LIF) en Python |
| 8 | Bio-informatique | 🔜 séquences ADN, alignement (jeux de données écrits à la main, pas de données réelles inventées) |
| 9 | Théorie des jeux | 🔜 dilemme du prisonnier, équilibre de Nash 2×2 |
| 10 | Signal et vision | 🔜 convolution ✅, FFT, filtres |
| 11 | Éthique de l'IA | 🔜 mesurer un biais sur des données jouets ; textes de loi : seulement si sourcés |
| 12 | Mini-OS | 🔜 ordonnanceur, pagination simulés |
| 13 | Compilateurs / langage | ✅ piste « Compilateurs » (02/10) : 7 leçons (lexeur, NPI, gare de triage, parseur récursif, interpréteur, machine à pile, calculatrice) |
| 14 | Réseaux de zéro | 🔜 paquets, somme de contrôle, retransmission simulés |
| 15 | NLP profond, Transformers | ✅ attention + piste « NLP et Transformers » (02/10) : 7 leçons (normaliser, n-grammes, TF-IDF, BPE, plongements, Bayes naïf, bloc Transformer) |

### Tuteurs IA (16–30)
| # | Idée | État |
|---|---|---|
| 16 | Tuteur qui mémorise tes erreurs | 🧩 table learn_erreurs (SQL à Alpha) |
| 17 | Mode socratique | ✅ (case dans le panneau des agents ; learn-tutor à redéployer) |
| 18 | Style d'apprentissage détecté | 🔜 préférence déclarée par l'élève (pas de détection invasive) |
| 19 | Explication par analogie | ✅ via le tuteur (consigne « analogie ») |
| 20 | Frappe nerveuse / frustration | ⚠️ pas de surveillance du clavier ; à la place : détection de blocage (erreurs répétées) → proposition d'indice |
| 21 | Exercices infinis sur l'actualité du web | 💶 + sources à citer : plus tard |
| 22 | Humeur des tuteurs | 🔜 personnalité par agent (déjà) ; « froid si hasard » : détection de tentatives au hasard |
| 23 | Voix générées dynamiquement | 💶 (voix du navigateur gratuites ✅ en attendant) |
| 24 | Traducteur Python ↔ JavaScript | 🔜 via le tuteur |
| 25 | Coach de style | 🔜 mode « revue de code » du tuteur |
| 26 | Client toxique simulé | 🔜 scénario d'agent |
| 27 | Cartes mentales auto | 🔜 |
| 28 | Mode Manga | 💶 images générées : écarté pour l'instant |
| 29 | Anti-triche | 🔜 collage détecté → « explique ligne par ligne » |
| 30 | Résumé vocal du matin | 🔜 voix du navigateur ; notifications : 🤝 |

### UX et gamification (31–45)
| # | Idée | État |
|---|---|---|
| 31 | Arbre de compétences | ✅ onglet Progression |
| 32 | Thèmes d'éditeur évolutifs | 🔜 (2 thèmes Finjaro/Noir ✅) |
| 33 | Succès | ✅ 13 succès calculés sur la vraie progression (« cachés » : 🔜) |
| 34 | Mode survie chronométré | 🔜 |
| 35 | Avatar personnalisable | 🔜 (visages ✅) |
| 36 | Musique procédurale | 🔜 Web Audio |
| 37 | Mode histoire | 🔜 scénarios d'exercices |
| 38 | Rétrospective « Wrapped » | ✅ « Mon bilan » (chiffres réels, sur l'appareil) ; annuel : 🔜 |
| 39 | Particules de réussite | ✅ |
| 40 | Marché virtuel (monnaie interne) | 🧩 sans argent réel |
| 41 | Mini-jeux dans la console | 🔜 |
| 42 | Titres honorifiques | ✅ titre selon la progression (sans valeur de diplôme) |
| 43 | Mode aveugle | 🔜 |
| 44 | Bouton reset « explosion » | 🔜 |
| 45 | Streak + jokers | ✅ série (sur l'appareil) · jokers 🧩 |

### Social et multijoueur (46–60)
Salles vocales (46), pair-programming aléatoire (47), primes (48), tournois (49), bataille royale (50), guildes (51), tableaux d'honneur (52), mentorat (53), fil technique (54), cartes à partager (55), éditeur collaboratif ✅ à 2+ (56), réputation (57), mode spectateur (58), quiz communautaires (59), traductions participatives (60) : 🧩 tous demandent de nouvelles tables learn_ et du temps réel → un dossier de conception par groupe, puis SQL à Alpha. Éditeur collaboratif (56), défis de groupe et entraide (57 en partie) sont déjà faits. Les voix en direct (46) : 🔜 WebRTC, sans serveur payant, à étudier.

### Pont vers l'emploi (61–75)
| # | État |
|---|---|
| 61 CV depuis compétences prouvées | 🔜 avec la session Outils (CV existant) |
| 62 Défis sponsorisés | 🤝 entreprises partenaires : décision de Beau |
| 63 Portfolio public sur finjaro.net | 🤝 Alpha |
| 64 Simulateur d'entretien technique | 🔜 texte d'abord ; webcam/voix 💶 |
| 65 Marché freelance | 🤝 Alpha |
| 66 Lettres de motivation ciblées | 🔜 session Outils |
| 67 Estimation de salaire | ⚠️ écarté : un chiffre non mesuré serait inventé |
| 68 Mode agence | 🧩 + 🤝 |
| 69 Badges « infalsifiables » | ⚠️ reformulé : badges vérifiables par lien public ; pas de promesse d'infalsifiabilité ni de certification d'université |
| 70 Offres géolocalisées | 🤝 |
| 71 Simulation Agile / Kanban | 🔜 |
| 72 Chiffrage de projet | 🔜 |
| 73 Dashboard recruteur payant | 🤝 + décision de Beau |
| 74 Clés API offertes | 💶 décision de Beau |
| 75 Projets de fin validés par experts | 🤝 |

### Outils d'ingénierie (76–85)
| # | État |
|---|---|
| 76 Sandbox + bases cloud | 🔜 SQLite/DuckDB dans le navigateur (gratuit) |
| 77 Éditeur de leçons no-code | 🔨 version locale (export JSON) · 🧩 publication |
| 78 Visualisation SQL | 🔜 |
| 79 Débogueur temporel visuel | ✅ Python (bouton « Pas à pas ») |
| 80 Données factices en un clic | 🔜 |
| 81 Refactoring IA commenté | 🔜 via le tuteur |
| 82 Mobile avec clavier de code | ✅ barre de symboles au-dessus de l'éditeur sur téléphone (02/10) |
| 83 Tableau blanc d'architecture | 🔜 |
| 84 Simulateur de charge | 🔜 simulation locale |
| 85 Maquette UI au pixel près | 🔜 comparaison d'images dans la page |

### Formats d'avenir (86–95)
Green coding (86) 🔜 · hors-ligne (87) 🔜 service worker · dictée du code (88) 🔜 voix du navigateur · vidéos génératives (89) 💶 · accessibilité (90) ✅ police lisible, contraste élevé, texte plus grand, lien d'évitement, clavier · podcasts (91) 💶/🔜 voix du navigateur · VR (92) ⚠️ trop tôt · micro-défis en notification (93) 🤝 · reverse engineering (94) 🔜 · lecture de code (95) ✅ 13 exercices.

### Rupture (96–100)
Prédiction d'échec (96) 🧩 · test de Turing interne (97) 🧩 · symbiose avec Finjaro Core (98) 🤝 · intelligence de groupe (99) 🧩 (compteurs agrégés réels) · simulateur de startup (100) 🔜 simulation locale.

## Deuxième liste
Tuteur proactif et vocal → voir 16–30 · Pont Finjaro (missions, portfolio, simulateur de startup) → 61–75 · Parcours enrichis : flux en direct (⚠️ API externes : conditions et coût à vérifier), arène de prompts 🔜, visualiseur de réseau de neurones ✅, Red Teaming sur un agent factice 🔜 (jamais sur les vrais agents Finjaro sans accord d'Alpha) · Roulette pair-programming, spectateur, guildes, panel d'agents sur questions sans réponse → 🧩 · Gamification : arbre ✅, code golf ✅ (meilleur score sur l'appareil ; classement mondial 🧩), ambiance sonore 🔜, streaks ✅ · Futur : débogueur temporel ✅, dictée 🔜, simulateur d'entretien 🔜/💶, prof pour tous 🔨/🧩.

## Ordre de travail décidé (valeur d'abord, gratuit d'abord)
1. ✅ Outils pédagogiques dans la page : débogueur temporel, lecture de code, visualiseur de réseau, code golf, mode socratique, particules.
2. 🔨 Progression : arbre de compétences, succès, bilan, streak, titres.
3. 🔜 Pistes de cours d'excellence (maths, crypto, ordinateurs, compilateurs, quantique, NLP, jeux, éthique) — chaque leçon vérifiée dans le navigateur.
4. 🧩 Dossiers de conception sociale (guildes, tournois, roulette, spectateur) → SQL pour Alpha.
5. 💶 / 🤝 : liste des décisions à poser à Beau (voir A-FAIRE).
