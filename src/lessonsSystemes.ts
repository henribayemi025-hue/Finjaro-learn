import type { Lesson } from './lessons'

// Parcours Systèmes et réseaux : ordonnanceur, cache LRU, somme de contrôle, retransmission, quorum, pagination par curseur. Contenu original.
export const systemesLessons: Lesson[] = [
  {
    id: "sys-tourniquet", lang: 'py', group: "systemes",
    title: { fr: "Partager le processeur : l'ordonnanceur en tourniquet", en: "Sharing the CPU: round-robin scheduler" },
    explain: {
      fr: "Ton ordinateur fait tourner des dizaines de programmes avec seulement quelques cœurs. Comment ? Un chef d’orchestre, l’ordonnanceur, donne à chaque programme une toute petite tranche de temps (le quantum), puis passe au suivant, en boucle. C’est le tourniquet.\nUn programme pas fini retourne au bout de la file. Résultat : personne n’attend indéfiniment, et tout a l’air de tourner en même temps.",
      en: "Your computer runs dozens of programs with only a few cores. How? A conductor, the scheduler, gives each program a tiny slice of time (the quantum), then moves to the next, in a loop. This is round robin.\nAn unfinished program goes back to the end of the line. Result: nobody waits forever, and everything looks like it runs at the same time.",
    },
    example: "from collections import deque\nfile = deque(['A', 'B'])\nfile.append(file.popleft())\nprint(list(file))",
    task: { fr: "Écris tourniquet(taches, quantum) → liste des noms dans l'ordre où ils FINISSENT. taches est une liste de (nom, durée). Puis fin(taches, quantum) → dict {nom: instant de fin} (le temps commence à 0).", en: "Write tourniquet(taches, quantum) → list of names in the order they FINISH. taches is a list of (name, duration). Then fin(taches, quantum) → dict {name: finish time} (time starts at 0)." },
    starter: "from collections import deque\n\ndef fin(taches, quantum):\n    pass\n\ndef tourniquet(taches, quantum):\n    pass\n",
    hint: { fr: "File = deque des [nom, reste]. À chaque tour : pris = min(quantum, reste) ; t += pris ; si reste − pris > 0, remets-la en fin de file, sinon note sa fin.", en: "Queue = deque of [name, remaining]. Each turn: used = min(quantum, remaining); t += used; if remaining − used > 0, put it back at the end, else record its finish." },
    solution: "from collections import deque\n\ndef fin(taches, quantum):\n    file = deque([nom, d] for nom, d in taches)\n    t, res = 0, {}\n    while file:\n        nom, reste = file.popleft()\n        pris = min(quantum, reste)\n        t += pris\n        if reste - pris > 0:\n            file.append([nom, reste - pris])\n        else:\n            res[nom] = t\n    return res\n\ndef tourniquet(taches, quantum):\n    f = fin(taches, quantum)\n    return sorted(f, key=f.get)",
    checks: ["fin([('A', 3), ('B', 1)], 2) == {'B': 3, 'A': 4}", "tourniquet([('A', 3), ('B', 1)], 2) == ['B', 'A']", "fin([('A', 5)], 2) == {'A': 5}", "tourniquet([('A', 2), ('B', 2), ('C', 2)], 1) == ['A', 'B', 'C']", "fin([('A', 2), ('B', 2), ('C', 2)], 1) == {'A': 4, 'B': 5, 'C': 6}", "fin([], 3) == {}"],
  },
  {
    id: "sys-cache", lang: 'py', group: "systemes",
    title: { fr: "Se souvenir du récent : le cache LRU", en: "Remembering the recent: LRU cache" },
    explain: {
      fr: "Lire dans la mémoire vive est des milliers de fois plus rapide que lire sur le réseau. Un cache est un petit carnet où l’on garde une copie de ce qu’on a utilisé récemment, pour ne pas le redemander.\nMais sa place est limitée : quand il est plein, il faut jeter quelque chose. La règle LRU (« Least Recently Used ») jette ce qu’on n’a pas touché depuis le plus longtemps. On la trouve dans les processeurs, les navigateurs, les bases de données.",
      en: "Reading from memory is thousands of times faster than reading over the network. A cache is a small notebook where you keep a copy of what you used recently, so you do not ask for it again.\nBut its room is limited: when it is full, something must go. The LRU rule (“Least Recently Used”) throws out what has not been touched for the longest time. You find it in processors, browsers, databases.",
    },
    example: "from collections import OrderedDict\nd = OrderedDict(a=1, b=2)\nd.move_to_end('a')\nprint(list(d))",
    task: { fr: "Écris la classe CacheLRU(capacite) avec lire(cle) → valeur ou None (une lecture rend la clé récente) et ecrire(cle, valeur) (si plein, jette la moins récente). Ajoute un compteur self.defauts : nombre de lire() qui n'ont rien trouvé.", en: "Write the class CacheLRU(capacite) with lire(cle) → value or None (a read makes the key recent) and ecrire(cle, valeur) (if full, drop the least recent). Add a counter self.defauts: number of lire() calls that found nothing." },
    starter: "from collections import OrderedDict\n\nclass CacheLRU:\n    def __init__(self, capacite):\n        pass\n\n    def lire(self, cle):\n        pass\n\n    def ecrire(self, cle, valeur):\n        pass\n",
    hint: { fr: "OrderedDict : move_to_end(cle) à chaque accès ; popitem(last=False) jette la plus ancienne.", en: "OrderedDict: move_to_end(cle) on each access; popitem(last=False) drops the oldest." },
    solution: "from collections import OrderedDict\n\nclass CacheLRU:\n    def __init__(self, capacite):\n        self.capacite = capacite\n        self.d = OrderedDict()\n        self.defauts = 0\n\n    def lire(self, cle):\n        if cle not in self.d:\n            self.defauts += 1\n            return None\n        self.d.move_to_end(cle)\n        return self.d[cle]\n\n    def ecrire(self, cle, valeur):\n        if cle in self.d:\n            self.d.move_to_end(cle)\n        self.d[cle] = valeur\n        if len(self.d) > self.capacite:\n            self.d.popitem(last=False)",
    checks: ["(lambda c: (c.ecrire('a', 1), c.ecrire('b', 2), c.lire('a'), c.ecrire('c', 3), c.lire('b'))[-1] is None)(CacheLRU(2))", "(lambda c: (c.ecrire('a', 1), c.ecrire('b', 2), c.lire('a'), c.ecrire('c', 3), c.lire('a'))[-1] == 1)(CacheLRU(2))", "(lambda c: (c.ecrire('a', 1), c.ecrire('a', 5), c.ecrire('b', 2), c.lire('a'))[-1] == 5)(CacheLRU(2))", "(lambda c: (c.lire('x'), c.ecrire('x', 1), c.lire('x'), c.lire('y'), c.defauts)[-1] == 2)(CacheLRU(1))", "(lambda c: (c.ecrire('a', 1), c.ecrire('b', 2), c.lire('a'))[-1] is None)(CacheLRU(1))"],
  },
  {
    id: "sys-controle", lang: 'py', group: "systemes",
    title: { fr: "Détecter une erreur de transmission : la somme de contrôle", en: "Detecting a transmission error: the checksum" },
    explain: {
      fr: "Sur un câble ou par radio, un bit peut s’inverser tout seul : un 0 devient un 1. Comment s’en apercevoir ? L’émetteur ajoute à la fin du message un petit total calculé avec les octets (la somme de contrôle). Le récepteur refait le calcul : si le total est différent, le message a été abîmé.\nUne simple somme ne voit pas deux octets échangés de place. La variante de Fletcher ajoute une deuxième somme qui dépend de la position, et détecte donc aussi les inversions d’ordre.",
      en: "On a cable or by radio, a bit can flip on its own: a 0 becomes a 1. How do you notice? The sender adds a small total computed from the bytes at the end of the message (the checksum). The receiver redoes the calculation: if the total differs, the message was damaged.\nA simple sum does not see two bytes swapped. Fletcher’s variant adds a second sum that depends on position, so it also catches order swaps.",
    },
    example: "octets = list('Salut'.encode())\nprint(octets, sum(octets) % 256)",
    task: { fr: "Écris fletcher16(octets) → entier : s1 = (s1 + o) % 255 puis s2 = (s2 + s1) % 255 pour chaque octet o, résultat s2 * 256 + s1. Puis emballer(octets) → octets + [s2, s1] et verifier(paquet) → True si les 2 derniers octets correspondent au reste.", en: "Write fletcher16(octets) → int: s1 = (s1 + o) % 255 then s2 = (s2 + s1) % 255 for each byte o, result s2 * 256 + s1. Then emballer(octets) → octets + [s2, s1] and verifier(paquet) → True if the last 2 bytes match the rest." },
    starter: "def fletcher16(octets):\n    pass\n\ndef emballer(octets):\n    pass\n\ndef verifier(paquet):\n    pass\n",
    hint: { fr: "Dans emballer : c = fletcher16(octets) ; s2 = c // 256, s1 = c % 256. verifier : emballer(paquet[:-2]) == list(paquet).", en: "In emballer: c = fletcher16(octets); s2 = c // 256, s1 = c % 256. verifier: emballer(paquet[:-2]) == list(paquet)." },
    solution: "def fletcher16(octets):\n    s1 = s2 = 0\n    for o in octets:\n        s1 = (s1 + o) % 255\n        s2 = (s2 + s1) % 255\n    return s2 * 256 + s1\n\ndef emballer(octets):\n    c = fletcher16(octets)\n    return list(octets) + [c // 256, c % 256]\n\ndef verifier(paquet):\n    return len(paquet) >= 2 and emballer(paquet[:-2]) == list(paquet)",
    checks: ["fletcher16([1, 2]) == 4 * 256 + 3", "fletcher16(list(b'abcde')) == 51440", "verifier(emballer([10, 20, 30]))", "not verifier([20, 10, 30] + emballer([10, 20, 30])[-2:])", "not verifier([10, 21, 30] + emballer([10, 20, 30])[-2:])", "verifier(emballer([]))"],
  },
  {
    id: "sys-retransmission", lang: 'py', group: "systemes",
    title: { fr: "Quand un paquet se perd : envoyer, attendre, renvoyer", en: "When a packet is lost: send, wait, resend" },
    explain: {
      fr: "Internet ne promet pas qu’un paquet arrive. Le moyen le plus simple d’être fiable : « envoyer et attendre ». Tu envoies un paquet et tu attends un accusé de réception, comme un accusé de lecture. S’il n’arrive pas avant un délai, tu renvoies.\nIl faut une limite de tentatives, sinon tu réessaies pour toujours sur une ligne coupée. C’est l’idée de base de TCP.",
      en: "The internet does not promise a packet arrives. The simplest way to be reliable: “send and wait”. You send a packet and wait for an acknowledgement, like a read receipt. If it does not arrive before a deadline, you send again.\nYou need a limit on attempts, otherwise you retry forever on a dead line. This is the basic idea of TCP.",
    },
    example: "canal = iter([False, True])  # False = perdu\nprint(next(canal), next(canal))",
    task: { fr: "Écris envoyer(n, canal, max_essais=5) → nombre total d'envois pour faire passer n paquets, ou None si un paquet échoue max_essais fois de suite. canal est une liste de booléens : True = cet envoi est arrivé (et acquitté). S'il n'y a plus d'éléments dans canal, considère que l'envoi est perdu.", en: "Write envoyer(n, canal, max_essais=5) → total number of sends to get n packets through, or None if a packet fails max_essais times in a row. canal is a list of booleans: True = this send arrived (and was acknowledged). If canal runs out, treat the send as lost." },
    starter: "def envoyer(n, canal, max_essais=5):\n    pass\n",
    hint: { fr: "Un indice i dans canal ; pour chaque paquet, boucle jusqu'à max_essais : arrive = canal[i] if i < len(canal) else False ; i += 1.", en: "An index i into canal; for each packet, loop up to max_essais: arrive = canal[i] if i < len(canal) else False; i += 1." },
    solution: "def envoyer(n, canal, max_essais=5):\n    i = 0\n    for _ in range(n):\n        for essai in range(max_essais):\n            arrive = canal[i] if i < len(canal) else False\n            i += 1\n            if arrive:\n                break\n        else:\n            return None\n    return i",
    checks: ["envoyer(2, [True, True]) == 2", "envoyer(2, [False, True, False, False, True]) == 5", "envoyer(1, [False] * 5 + [True]) is None", "envoyer(1, [False] * 5 + [True], max_essais=6) == 6", "envoyer(0, []) == 0", "envoyer(1, []) is None"],
  },
  {
    id: "sys-quorum", lang: 'py', group: "systemes",
    title: { fr: "Se mettre d'accord à plusieurs : le quorum", en: "Agreeing as a group: the quorum" },
    explain: {
      fr: "Les grands services tournent sur plusieurs machines pour survivre aux pannes. Mais comment décider ensemble quand certaines ne répondent plus ? Règle de base : une décision est prise quand une majorité stricte l’accepte. Ce nombre minimum s’appelle le quorum : n // 2 + 1 (pour 5 machines : 3).\nPourquoi ça marche : deux majorités ont toujours au moins une machine en commun, donc il est impossible de décider deux choses contradictoires. C’est la base de systèmes de consensus comme Raft.",
      en: "Big services run on several machines to survive failures. But how do you decide together when some stop answering? Basic rule: a decision is made when a strict majority accepts it. That minimum number is the quorum: n // 2 + 1 (for 5 machines: 3).\nWhy it works: two majorities always share at least one machine, so deciding two contradictory things is impossible. It is the basis of consensus systems like Raft.",
    },
    example: "n = 5\nprint(n // 2 + 1)",
    task: { fr: "Écris quorum(n) → taille de la majorité stricte. Puis elu(votes, n) → le candidat qui a au moins quorum(n) voix, sinon None. votes est un dict {machine: candidat} (les machines en panne n'y sont pas). Puis pannes_tolerees(n) → combien de machines peuvent tomber sans bloquer.", en: "Write quorum(n) → strict majority size. Then elu(votes, n) → the candidate with at least quorum(n) votes, else None. votes is a dict {machine: candidate} (failed machines are absent). Then pannes_tolerees(n) → how many machines can fail without blocking." },
    starter: "from collections import Counter\n\ndef quorum(n):\n    pass\n\ndef elu(votes, n):\n    pass\n\ndef pannes_tolerees(n):\n    pass\n",
    hint: { fr: "Counter(votes.values()).most_common(1) donne le meilleur candidat. pannes_tolerees = n − quorum(n).", en: "Counter(votes.values()).most_common(1) gives the top candidate. pannes_tolerees = n − quorum(n)." },
    solution: "from collections import Counter\n\ndef quorum(n):\n    return n // 2 + 1\n\ndef elu(votes, n):\n    if not votes:\n        return None\n    cand, nb = Counter(votes.values()).most_common(1)[0]\n    return cand if nb >= quorum(n) else None\n\ndef pannes_tolerees(n):\n    return n - quorum(n)",
    checks: ["quorum(5) == 3 and quorum(4) == 3 and quorum(1) == 1", "elu({'m1': 'A', 'm2': 'A', 'm3': 'B'}, 3) == 'A'", "elu({'m1': 'A', 'm2': 'B'}, 5) is None", "elu({'m1': 'A', 'm2': 'A'}, 5) is None", "elu({}, 3) is None", "pannes_tolerees(5) == 2 and pannes_tolerees(4) == 1 and pannes_tolerees(3) == 1"],
  },
  {
    id: "sys-pagination", lang: 'py', group: "systemes",
    title: { fr: "Lister des milliers d'éléments : la pagination par curseur", en: "Listing thousands of items: cursor pagination" },
    explain: {
      fr: "Une appli ne charge jamais 10 000 messages d’un coup : elle les demande page par page. La méthode naïve « page 3 = éléments 20 à 29 » a un défaut : si un élément est ajouté entre-temps, tout se décale, et tu vois un doublon ou tu en rates un.\nLa pagination par curseur dit plutôt « donne-moi les 10 suivants APRÈS l’identifiant 42 ». C’est stable, même si la liste bouge.",
      en: "An app never loads 10,000 messages at once: it asks for them page by page. The naive method “page 3 = items 20 to 29” has a flaw: if an item is added meanwhile, everything shifts, and you see a duplicate or miss one.\nCursor pagination says instead “give me the 10 next AFTER id 42”. It is stable, even if the list moves.",
    },
    example: "ids = [1, 4, 7, 9]\nprint([i for i in ids if i > 4][:2])",
    task: { fr: "Écris page(elements, taille, apres=None) → (liste, curseur). elements est une liste de dict triés par 'id' croissant ; on renvoie les taille premiers dont id > apres (tous si apres est None), et curseur = id du dernier renvoyé, ou None s'il n'y a plus rien après.", en: "Write page(elements, taille, apres=None) → (list, cursor). elements is a list of dicts sorted by ascending 'id'; return the first taille whose id > apres (all if apres is None), and cursor = id of the last returned, or None if nothing is left after." },
    starter: "def page(elements, taille, apres=None):\n    pass\n",
    hint: { fr: "reste = [e for e in elements if apres is None or e['id'] > apres] ; lot = reste[:taille] ; curseur = lot[-1]['id'] si len(reste) > taille.", en: "reste = [e for e in elements if apres is None or e['id'] > apres]; lot = reste[:taille]; cursor = lot[-1]['id'] if len(reste) > taille." },
    solution: "def page(elements, taille, apres=None):\n    reste = [e for e in elements if apres is None or e['id'] > apres]\n    lot = reste[:taille]\n    curseur = lot[-1]['id'] if len(reste) > taille else None\n    return lot, curseur",
    checks: ["page([{'id': i} for i in (1, 2, 3)], 2) == ([{'id': 1}, {'id': 2}], 2)", "page([{'id': i} for i in (1, 2, 3)], 2, 2) == ([{'id': 3}], None)", "page([{'id': i} for i in (1, 2)], 2) == ([{'id': 1}, {'id': 2}], None)", "page([], 5) == ([], None)", "(lambda E: (lambda p1: page([{'id': 0}] + E, 2, p1[1])[0])(page(E, 2)))([{'id': i} for i in (1, 2, 3, 4)]) == [{'id': 3}, {'id': 4}]"],
  },
]
