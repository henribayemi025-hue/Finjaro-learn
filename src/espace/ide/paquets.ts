// Le catalogue de bibliothèques proposées dans l'espace de travail : elles se chargent dans le navigateur (Pyodide), rien à installer sur la machine.
export interface Paquet { id: string; import: string; categorie: 'donnees' | 'calcul' | 'ia' | 'image' | 'texte' | 'outils'; fr: string; en: string }

export const CATALOGUE: Paquet[] = [
  { id: 'numpy', import: 'import numpy as np', categorie: 'calcul', fr: 'Calcul sur de grands tableaux de nombres.', en: 'Maths on big arrays of numbers.' },
  { id: 'pandas', import: 'import pandas as pd', categorie: 'donnees', fr: 'Tableaux de données : lire un csv, filtrer, regrouper.', en: 'Data tables: read a csv, filter, group.' },
  { id: 'matplotlib', import: 'import matplotlib.pyplot as plt', categorie: 'donnees', fr: 'Graphiques : courbes, barres, nuages de points.', en: 'Charts: lines, bars, scatter plots.' },
  { id: 'scipy', import: 'import scipy', categorie: 'calcul', fr: 'Sciences : statistiques, optimisation, algèbre.', en: 'Science: statistics, optimisation, algebra.' },
  { id: 'scikit-learn', import: 'from sklearn.linear_model import LinearRegression', categorie: 'ia', fr: 'Apprentissage automatique classique.', en: 'Classic machine learning.' },
  { id: 'seaborn', import: 'import seaborn as sns', categorie: 'donnees', fr: 'Graphiques statistiques élégants.', en: 'Elegant statistical charts.' },
  { id: 'sympy', import: 'import sympy as sp', categorie: 'calcul', fr: 'Maths symboliques : équations, dérivées.', en: 'Symbolic maths: equations, derivatives.' },
  { id: 'networkx', import: 'import networkx as nx', categorie: 'calcul', fr: 'Graphes et réseaux.', en: 'Graphs and networks.' },
  { id: 'statsmodels', import: 'import statsmodels.api as sm', categorie: 'ia', fr: 'Modèles statistiques et séries temporelles.', en: 'Statistical models and time series.' },
  { id: 'pillow', import: 'from PIL import Image', categorie: 'image', fr: 'Ouvrir et transformer des images.', en: 'Open and transform images.' },
  { id: 'opencv-python', import: 'import cv2', categorie: 'image', fr: 'Vision par ordinateur.', en: 'Computer vision.' },
  { id: 'xgboost', import: 'import xgboost as xgb', categorie: 'ia', fr: 'Arbres boostés, très utilisés en compétition.', en: 'Boosted trees, popular in competitions.' },
  { id: 'lightgbm', import: 'import lightgbm as lgb', categorie: 'ia', fr: 'Arbres boostés rapides.', en: 'Fast boosted trees.' },
  { id: 'beautifulsoup4', import: 'from bs4 import BeautifulSoup', categorie: 'texte', fr: 'Lire et extraire du HTML.', en: 'Read and extract HTML.' },
  { id: 'lxml', import: 'import lxml', categorie: 'texte', fr: 'Lire du XML et du HTML.', en: 'Read XML and HTML.' },
  { id: 'pyyaml', import: 'import yaml', categorie: 'outils', fr: 'Lire et écrire du YAML.', en: 'Read and write YAML.' },
  { id: 'regex', import: 'import regex', categorie: 'texte', fr: 'Expressions régulières avancées.', en: 'Advanced regular expressions.' },
]
/** Les noms de Pyodide et d'import ne sont pas toujours les mêmes (scikit-learn, pillow, opencv-python). */
export const nomPyodide = (id: string) => ({ 'scikit-learn': 'scikit-learn', pillow: 'pillow', 'opencv-python': 'opencv-python', pyyaml: 'pyyaml' } as Record<string, string>)[id] ?? id
const equivalents: Record<string, string[]> = { 'scikit-learn': ['scikit-learn', 'sklearn'], pillow: ['pillow', 'pil'], 'opencv-python': ['opencv-python', 'cv2'], pyyaml: ['pyyaml', 'yaml'], beautifulsoup4: ['beautifulsoup4', 'bs4'] }
/** Ce paquet est-il déjà chargé ? (la liste vient de l'interpréteur) */
export const estCharge = (id: string, charges: string[]) => {
  const l = charges.map((x) => x.toLowerCase().replace(/_/g, '-'))
  return (equivalents[id] ?? [id]).some((x) => l.includes(x))
}
