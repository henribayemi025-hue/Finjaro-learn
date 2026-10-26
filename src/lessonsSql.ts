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

export const sqlLessons: Lesson[] = [
  {
    id: 'sql-select', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Lire une table : SELECT', en: 'Reading a table: SELECT' },
    explain: {
      fr: "Une base de données, c’est un classeur de tableaux. Ici, deux tableaux (on dit « tables ») : products (id, name, category, price, stock) et sales (id, product_id, quantity, day).\nSQL est la langue pour poser une question à la base. SELECT veut dire « montre-moi » et dit quelles colonnes tu veux. FROM dit dans quelle table aller chercher.\nExemple : SELECT name FROM products; veut dire « montre-moi la colonne name de la table products ». Le point-virgule ; dit que ta question est finie.",
      en: "A database is a binder of tables. Here, two tables: products (id, name, category, price, stock) and sales (id, product_id, quantity, day).\nSQL is the language to ask the database a question. SELECT means “show me” and says which columns you want. FROM says which table to look in.\nExample: SELECT name FROM products; means “show me the name column of the products table”. The semicolon ; says your question is over.",
    },
    example: 'SELECT name, stock FROM products;',
    task: { fr: 'Affiche le nom (name) et le prix (price) de tous les articles.', en: 'Show the name and the price of every product.' },
    starter: 'SELECT ', hint: { fr: 'SELECT name, price FROM products;', en: 'SELECT name, price FROM products;' },
    solution: 'SELECT name, price FROM products;', checks: [],
  },
  {
    id: 'sql-where', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Filtrer : WHERE', en: 'Filtering: WHERE' },
    explain: {
      fr: "Souvent tu ne veux pas toutes les lignes, seulement certaines. WHERE veut dire « seulement si » : tu écris une condition, et la base ne garde que les lignes qui la respectent.\nExemples : WHERE price > 10000 (prix au-dessus de 10000), WHERE stock = 0 (plus en stock), WHERE category = 'chaussures' (un texte va entre apostrophes).\nTu peux combiner deux conditions : AND veut dire « et les deux », OR veut dire « l’une ou l’autre ».",
      en: "Often you do not want every row, only some. WHERE means “only if”: you write a condition, and the database keeps just the rows that meet it.\nExamples: WHERE price > 10000, WHERE stock = 0 (out of stock), WHERE category = 'shoes' (text goes in apostrophes).\nYou can combine two conditions: AND means “both”, OR means “either one”.",
    },
    example: 'SELECT name FROM products WHERE stock > 5;',
    task: { fr: 'Affiche le nom et le prix des articles qui coûtent plus de 10000.', en: 'Show the name and price of the products that cost more than 10000.' },
    starter: 'SELECT ', hint: { fr: 'Ajoute WHERE price > 10000 après FROM products.', en: 'Add WHERE price > 10000 after FROM products.' },
    solution: 'SELECT name, price FROM products WHERE price > 10000;', checks: [],
  },
  {
    id: 'sql-order', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Trier : ORDER BY', en: 'Sorting: ORDER BY' },
    explain: {
      fr: "ORDER BY veut dire « range dans cet ordre ». ORDER BY price range du moins cher au plus cher. Ajoute DESC pour l’inverse : ORDER BY price DESC, du plus cher au moins cher.\nSans ORDER BY, la base te renvoie les lignes dans l’ordre qu’elle veut. Ici l’ordre des lignes compte : il est vérifié.",
      en: "ORDER BY means “sort in this order”. ORDER BY price sorts from cheapest to most expensive. Add DESC for the opposite: ORDER BY price DESC.\nWithout ORDER BY, the database returns rows in whatever order it likes. Here the order of rows matters: it is checked.",
    },
    example: 'SELECT name, stock FROM products ORDER BY stock;',
    task: { fr: 'Affiche le nom et le prix de tous les articles, du plus cher au moins cher.', en: 'Show the name and price of every product, from the most expensive to the cheapest.' },
    starter: 'SELECT ', hint: { fr: 'ORDER BY price DESC à la fin.', en: 'ORDER BY price DESC at the end.' },
    solution: 'SELECT name, price FROM products ORDER BY price DESC;', checks: [],
  },
  {
    id: 'sql-count', lang: 'sql', group: 'sql', sql: { setup, setupEn },
    title: { fr: 'Compter et additionner : COUNT, SUM', en: 'Counting and adding: COUNT, SUM' },
    explain: {
      fr: "Parfois tu ne veux pas la liste, juste un chiffre qui la résume. Ce sont les fonctions de résumé :\nCOUNT(*) compte les lignes. SUM(colonne) additionne. AVG(colonne) donne la moyenne. MAX(colonne) donne la plus grande valeur, MIN(colonne) la plus petite.\nExemple : SELECT COUNT(*) FROM products; répond « combien d’articles ? ».",
      en: "Sometimes you do not want the list, just one number that sums it up. These are the summary functions:\nCOUNT(*) counts rows. SUM(column) adds up. AVG(column) gives the average. MAX(column) gives the largest value, MIN(column) the smallest.\nExample: SELECT COUNT(*) FROM products; answers “how many items?”.",
    },
    example: 'SELECT SUM(stock) FROM products;',
    task: { fr: 'Combien d’articles sont en rupture de stock (stock = 0) ? Une seule valeur.', en: 'How many products are out of stock (stock = 0)? A single value.' },
    starter: 'SELECT ', hint: { fr: 'SELECT COUNT(*) FROM products WHERE stock = 0;', en: 'SELECT COUNT(*) FROM products WHERE stock = 0;' },
    solution: 'SELECT COUNT(*) FROM products WHERE stock = 0;', checks: [],
  },
  {
    id: 'sql-group', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Regrouper : GROUP BY', en: 'Grouping: GROUP BY' },
    explain: {
      fr: "GROUP BY veut dire « fais un résumé pour chaque groupe ». Si tu groupes par category, tu obtiens une ligne par catégorie, avec par exemple le nombre d’articles de chacune.\nExemple : SELECT category, COUNT(*) FROM products GROUP BY category;\nRègle simple : chaque colonne que tu montres doit être soit celle du GROUP BY, soit dans une fonction de résumé (COUNT, SUM…).",
      en: "GROUP BY means “make a summary for each group”. If you group by category, you get one row per category, for example the number of items in each.\nExample: SELECT category, COUNT(*) FROM products GROUP BY category;\nSimple rule: every column you show must be either the GROUP BY one or inside a summary function (COUNT, SUM…).",
    },
    example: 'SELECT category, MAX(price) FROM products GROUP BY category;',
    task: { fr: 'Pour chaque catégorie : la catégorie, le nombre d’articles et le stock total, triés par catégorie.', en: 'For each category: the category, the number of products and the total stock, sorted by category.' },
    starter: 'SELECT ', hint: { fr: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;', en: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;' },
    solution: 'SELECT category, COUNT(*), SUM(stock) FROM products GROUP BY category ORDER BY category;', checks: [],
  },
  {
    id: 'sql-join', lang: 'sql', group: 'sql', sql: { setup, setupEn, ordre: true },
    title: { fr: 'Relier deux tables : JOIN', en: 'Linking two tables: JOIN' },
    explain: {
      fr: "Une vente (table sales) ne garde que le numéro de l’article (product_id), pas son nom. Le nom est dans l’autre table, products. Pour avoir les deux ensemble, on relie les tables avec JOIN.\nFROM sales s JOIN products p ON p.id = s.product_id veut dire « colle chaque vente à l’article qui a le même numéro ».\ns et p sont juste des surnoms courts pour les tables, pour écrire moins.",
      en: "A sale (sales table) only keeps the item number (product_id), not its name. The name is in the other table, products. To get both together, you link the tables with JOIN.\nFROM sales s JOIN products p ON p.id = s.product_id means “stick each sale to the item with the same number”.\ns and p are just short nicknames for the tables, to write less.",
    },
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
