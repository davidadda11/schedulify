# Schedulify

Schedulify este o platforma educationala pe care am construit-o de la zero pentru a ajuta elevii sa isi organizeze eficient pregatirea pentru examene. Aplicatia rezolva o problema reala de gestionare a timpului: utilizatorul introduce numarul de ore disponibile pe zi si materiile studiate, iar sistemul genereaza automat un program structurat pe zile. Elevii pot bifa sarcinile indeplinite, pot urmari progresul in timp real si pot analiza raspunsurile de la teste direct in aplicatie.

Tot fluxul de inteligenta artificiala ruleaza complet local prin Ollama — datele raman pe masina utilizatorului, fara costuri de API si fara stocare in cloud.

link github: https://github.com/davidadda11/schedulify
---

## Stack Tehnologic

- **SvelteKit + TypeScript** — Arhitectura unificata pentru frontend si backend (rutare si endpoint-uri API)
- **Bun** — Runtime rapid si package manager performant
- **PostgreSQL** — Baza de date relationala rulata izolat prin **Docker**
- **Drizzle ORM** — Gestionarea schemelor si a migrarilor de date
- **Better Auth** — Sistem complet si sigur pentru autentificare
- **Ollama** — Integrare inteligenta artificiala locala (modele optimizate pentru text si analiza vizuala)
- **Tailwind CSS** — Stil vizual modern (tema Dark Mode `#0a1628`, carduri albe cu `border-radius: 24px`)

---

## Instalare si Configurare

### 1. Cerinte Preliminare

Instaleaza componentele in urmatoarea ordine:

* **Docker Desktop** ([Descarca Docker](https://www.docker.com/products/docker-desktop)) — Porneste aplicatia Docker in fundal inainte de a continua.
* **Bun Runtime** — Ruleaza comanda corespunzatoare sistemului tau:
  ```bash
  # Linux / WSL (Ubuntu)
  curl -fsSL https://bun.sh/install | bash
  ```
  ```powershell
  # Windows (PowerShell)
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
* **Ollama** ([Descarca Ollama](https://ollama.com/download)) — Instaleaza aplicatia si asigura-te ca serviciul ruleaza in background.
* **Git** ([Descarca Git](https://git-scm.com)) — Necesar pentru clonarea proiectului.

---

### 2. Clonarea Proiectului si Dependinte

Deschide terminalul (recomandat WSL Ubuntu pentru compatibilitate deplina cu schita proiectului) si ruleaza:

```bash
git clone https://github.com
cd schedulify-main
bun install
```

---

### 3. Variabilele de Mediu

Copiaza fisierul model pentru a crea configuratia locala:

```bash
cp .env.example .env
```

Deschide fisierul `.env` si completeaza datele necesare:
```env
DATABASE_URL=postgres://root:mysecretpassword@localhost:5432/local
ORIGIN=http://localhost:5173
BETTER_AUTH_SECRET=pune_aici_un_sir_random_de_minimum_32_caractere
BETTER_AUTH_URL=http://localhost:5173
```

*Sfat: Poti genera rapid un secret securizat ruland urmatoarea comanda in terminal:*
```bash
openssl rand -base64 32
```

---

### 4. Initializarea Bazei de Date

Porneste containerul de PostgreSQL definit in `compose.yaml`:

```bash
docker compose up -d
```
*Asteapta aproximativ 15-20 de secunde pentru ca baza de date sa devina complet activa.*

Ruleaza migrarea pentru a genera tabelele necesare (inclusiv schema pentru `study_plan_items`):
```bash
bun run db:migrate
```
*Poti verifica starea containerului folosind comanda `docker ps`.*

---

### 5. Descarcarea Modelelor AI (Ollama)

Proiectul este compatibil cu mai multe modele. Descarca variantele principale rulate in aplicatie:

```bash
ollama pull qwen2.5:1.5b
ollama pull llava-phi3
```
* qwen2.5:1.5b (~986 MB) — Model rapid folosit implicit pentru generarea planului de invatamant.
* llava-phi3 (~2.9 GB) — Model multimodal utilizat pentru functionalitatile de analiza vizuala.

Poti verifica modelele descarcate cu: `ollama list`

---

### 6. Pornirea Aplicatiei

Lanseaza serverul de dezvoltare:
```bash
bun run dev
```
Aplicatia va fi accesibila in browser la adresa: `http://localhost:5173`

---

## Rute Principale (Interfata)

| Ruta | Functionalitate |
|---|---|
| `/login`, `/register` | Autentificare si creare cont elev |
| `/creare-program` | Interfata de input ore/materii si generare program cu AI |
| `/sali-pregatire` | Panou de organizare si gestionare pe grupe de studiu |
| `/sali-pregatire/analiza-test` | Zona de incarcare si evaluare a raspunsurilor cu ajutorul AI |
| `/intrebari-pregatitoare` | Seturi de intrebari generate automat pe baza materiilor |

---

## Depanare (Troubleshooting)

**1. Eroare TS: Cannot find name 'process' in `drizzle.config.ts`**
* **Cauza:** TypeScript nu recunoaste globalul `process` specific Node.js intr-un mediu pornit cu Bun.
* **Rezolvare:** Inlocuieste `process.env.DATABASE_URL` cu varianta nativa din Bun: `Bun.env.DATABASE_URL`. Alternativ, poti instala tipurile ruland: `bun add -d @types/node`.

**2. Eroare 500 / AI-ul nu raspunde**
* **Cauza:** Serviciul Ollama este oprit sau modelul selectat nu este descarcat local.
* **Rezolvare:** Verifica ruleaza ruland `ollama list`. Daca primesti eroare de conexiune, porneste aplicatia Ollama. Daca modelul lipseste, ruleaza din nou `ollama pull qwen2.5:1.5b`.

**3. Eroare de conexiune la Baza de Date**
* **Cauza:** Containerul Docker nu ruleaza sau portul `5432` este blocat de o alta instanta locala de PostgreSQL.
* **Rezolvare:** Ruleaza `docker ps` sa vezi daca serviciul este activ. Daca nu apare, foloseste `docker compose down` si apoi `docker compose up -d`.

**4. Portul 5173 este deja ocupat**
* **Rezolvare:** Gaseste si opreste procesul blocat cu comanda:
  ```bash
  lsof -i :5173
  kill -9 <PID>
  ```

---

## Echipa de Dezvoltare

* **Belenchi Robert Marian** — [@RoBee05](https://github.com/RoBee05)
* **Poterasi David Stefan** — [@davidadda11](https://github.com/davidadda11)
