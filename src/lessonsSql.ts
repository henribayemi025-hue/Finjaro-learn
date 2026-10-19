import type { Lesson } from './lessons'

// Parcours SQL (Beau, 14/10 : « il manque Power BI, R, C++, SQL »). Les requêtes tournent dans le navigateur (sql.js, SQLite) ;
// le verdict compare le résultat de l'élève à celui de la solution, sur la même base neuve. Données inventées pour l'exercice.
const base = (n: { robe: string; sac: string; savon: string; chemise: string; parfum: string; ceinture: string; vet: string; maro: string; beaute: string }) => `
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price INTEGER, stock INTEGER);
INSERT INTO products VALUES (1, '${n.robe}', '${n.vet}', 15000, 4), (2, '${n.sac}', '${n.maro}', 22000, 2), (3, '${n.savon}', '${n.beaute}', 1500, 30),
  (4, '${n.chemise}', '${n.vet}', 12000, 0), (5, '${n.parfum}', '${n.beaute}', 18000, 5), (6, '${n.ceinture}', '${n.maro}', 8000, 7);
CREATE TABLE sales (id INTEGER PRIMARY KEY, product_id INTEGER, quantity INTEGER, day TEXT);
INSERT INTO sales VALUES (1, 1, 2, '2026-10-01'), (2, 3, 10, '2026-10-01'), (3, 5, 1, '2026-10-02'), (4, 1, 1, '2026-10-03'), (5, 2, 1, '2026-10-03'), (6, 3, 5, '2026-10-04');`
const setup = base({ robe: 'Robe en wax', sac: 'Sac à main', savon: 'Savon au karité', chemise: 'Chemise en lin', parfum: 'Parfum', ceinture: 'Ceinture en cuir', vet: 'Vêtements', maro: 'Maroquinerie', beaute: 'Beauté' })
const setupEn = base({ robe: 'Wax dress', sac: 'Handbag', savon: 'Shea soap', chemise: 'Linen shirt', parfum: 'Perfume', ceinture: 'Leather belt', vet: 'Clothing', maro: 'Leather goods', beaute: 'Beauty' })
const tables = {
  fr: 'Deux tables : products (id, name, category, price, stock) et sales (id, product_id, quantity, day). ',
  en: 'Two tables: products (id, name, category, price, stock) and sales (id, product_id, quantity, day). ',
}

export const sqlLessons: Lesson[] = [
  {
    id: 'sql-select', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Lire une table : SELECT', en: 'Reading a table: SELECT' },
    explain: { fr: tables.fr + 'Une requête SQL demande des données : SELECT dit quelles colonnes, FROM dit dans quelle table. Le point-virgule termine la requête.', en: tables.en + 'An SQL query asks for data: SELECT says which columns, FROM says which table. The semicolon ends the query.' },
    example: 'SELECT name, stock FROM products;',
    task: { fr: 'Affiche le nom (name) et le prix (price) de tous les articles.', en: 'Show the name and the price of every product.' },
    starter: 'SELECT ', hint: { fr: 'SELECT name, price FROM products;', en: 'SELECT name, price FROM products;' },
    solution: 'SELECT name, price FROM products;', checks: [],
  },
  {
    id: 'sql-where', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Filtrer : WHERE', en: 'Filtering: WHERE' },
    explain: { fr: 'WHERE garde seulement les lignes qui respectent une condition : price > 10000, stock = 0, category = \'…\'. On peut combiner avec AND et OR.', en: 'WHERE keeps only the rows that meet a condition: price > 10000, stock = 0, category = \'…\'. Combine with AND and OR.' },
    example: 'SELECT name FROM products WHERE stock > 5;',
    task: { fr: 'Affiche le nom et le prix des articles qui coûtent plus de 10000.', en: 'Show the name and price of the products that cost more than 10000.' },
    starter: 'SELECT ', hint: { fr: 'Ajoute WHERE price > 10000 après FROM products.', en: 'Add WHERE price > 10000 after FROM products.' },
    solution: 'SELECT name, price FROM products WHERE price > 10000;', checks: [],
  },
  {
    id: 'sql-order', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Trier : ORDER BY', en: 'Sorting: ORDER BY' },
    explain: { fr: 'ORDER BY range le résultat : ASC du plus petit au plus grand (par défaut), DESC du plus grand au plus petit. Ici, l’ordre des lignes compte pour la vérification.', en: 'ORDER BY sorts the result: ASC from smallest to largest (the default), DESC from largest to smallest. Here, the order of the rows matters for the check.' },
    example: 'SELECT name, stock FROM products ORDER BY stock;',
    task: { fr: 'Affiche le nom et le prix de tous les articles, du plus cher au moins cher.', en: 'Show the name and price of every product, from the most expensive to the cheapest.' },
    starter: 'SELECT ', hint: { fr: 'ORDER BY price DESC à la fin.', en: 'ORDER BY price DESC at the end.' },
    solution: 'SELECT name, price FROM products ORDER BY price DESC;', checks: [],
  },
  {
    id: 'sql-count', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Compter et additionner : COUNT, SUM', en: 'Counting and adding: COUNT, SUM' },
    explain: { fr: 'Les fonctions d’agrégat résument plusieurs lignes en une : COUNT(*) compte, SUM(colonne) additionne, AVG fait la moyenne, MAX et MIN donnent les extrêmes.', en: 'Aggregate functions sum up several rows into one: COUNT(*) counts, SUM(column) adds, AVG averages, MAX and MIN give the extremes.' },
    example: 'SELECT SUM(stock) FROM products;',
    task: { fr: 'Combien d’articles sont en rupture de stock (stock = 0) ? Une seule valeur.', en: 'How many products are out of stock (stock = 0)? A single value.' },
    starter: 'SELECT ', hint: { fr: 'SELECT COUNT(*) FROM products WHERE stock = 0;', en: 'SELECT COUNT(*) FROM products WHERE stock = 0;' },
    solution: 'SELECT COUNT(*) FROM products WHERE stock = 0;', checks: [],
  },
  {
    id: 'sql-group', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Regrouper : GROUP BY', en: 'Grouping: GROUP BY' },
    explain: { fr: 'GROUP BY fait un résumé par groupe : une ligne par catégorie, avec ses COUNT et SUM. Chaque colonne affichée est soit dans le GROUP BY, soit dans une fonction d’agrégat.', en: 'GROUP BY makes one summary per group: one row per category, with its COUNT and SUM. Each column shown is either in the GROUP BY or inside an aggregate function.' },
    example: 'SELECT category, MAX(price) FROM products GROUP BY category;',
    task: { fr: 'Pour chaque catégorie : la catégorie, le nombre d’articles et le stock total, triés par catégorie.', en: 'For each category: the category, the number of products and the total stock, sorted by category.' },
    starter: 'SELECT ', hint: { fr: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;', en: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;' },
    solution: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;', checks: [],
  },
  {
    id: 'sql-join', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Relier deux tables : JOIN', en: 'Linking two tables: JOIN' },
    explain: { fr: 'Une vente ne garde que l’id de l’article (product_id). JOIN relie les deux tables : FROM sales s JOIN products p ON p.id = s.product_id. Les lettres s et p sont des alias.', en: 'A sale only keeps the product id (product_id). JOIN links both tables: FROM sales s JOIN products p ON p.id = s.product_id. The letters s and p are aliases.' },
    example: 'SELECT s.day, s.quantity FROM sales s;',
    task: { fr: 'Pour chaque vente, dans l’ordre des ventes (s.id) : le nom de l’article et la quantité.', en: 'For each sale, in sale order (s.id): the product name and the quantity.' },
    starter: 'SELECT ', hint: { fr: 'SELECT p.name, s.quantity FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.id;', en: 'SELECT p.name, s.quantity FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.id;' },
    solution: 'SELECT p.name, s.quantity FROM sales s JOIN products p ON p.id = s.product_id ORDER BY s.id;', checks: [],
  },
  {
    id: 'sql-projet', lang: 'sql', group: 'sql', niveau: 'projet', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Projet du module : le chiffre d’affaires par article', en: 'Module project: revenue per product' },
    explain: { fr: 'Le projet réunit le module : JOIN, calcul, GROUP BY et ORDER BY. Le chiffre d’affaires d’une vente = quantité × prix de l’article.', en: 'The project brings the module together: JOIN, calculation, GROUP BY and ORDER BY. The revenue of a sale = quantity × product price.' },
    example: 'SELECT s.quantity * 2 AS double FROM sales s;',
    task: { fr: 'Pour chaque article vendu : son nom et son chiffre d’affaires total, du plus grand au plus petit.', en: 'For each product sold: its name and its total revenue, from the largest to the smallest.' },
    starter: 'SELECT ', hint: { fr: 'SUM(s.quantity * p.price) avec un JOIN, GROUP BY p.name, ORDER BY … DESC.', en: 'SUM(s.quantity * p.price) with a JOIN, GROUP BY p.name, ORDER BY … DESC.' },
    solution: 'SELECT p.name, SUM(s.quantity * p.price) AS revenue FROM sales s JOIN products p ON p.id = s.product_id GROUP BY p.name ORDER BY revenue DESC;', checks: [],
  },
]
