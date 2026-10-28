# ClinicFlow - Application de Gestion Médicale (PERN Stack)

ClinicFlow est une application web full-stack développée dans le cadre du test technique Tython. L'application permet de gérer les patients, les rendez-vous et les rôles utilisateurs (Admin & Staff) pour une clinique médicale.

---

## 📐 1. Conception & Base de Données

### Schéma Relational (ERD) & Constraints
* **`users`** : Stocke les identifiants et rôles des membres du personnel (`id` UUID, `email` UNIQUE, `password` haché, `role` 'admin'/'staff', `createdAt`).
* **`patients`** : Gère les informations des patients (`id` UUID, `fullName`, `cin` UNIQUE, `phone`, `birthDate`, `address`, `createdAt`).
* **`appointments`** : Planifie les rendez-vous (`id` UUID, `patientId` FK, `appointmentDate`, `status` 'pending'/'confirmed'/'cancelled', `reason`, `notes`, `createdBy` FK, `createdAt`).

### Justification des Relations
* **1-N (Patient ➔ Appointments)** : Un patient peut avoir plusieurs rendez-vous au fil du temps. Chaque rendez-vous appartient à un patient unique (`patientId`).
* **1-N (User ➔ Appointments)** : Un utilisateur (Admin/Staff) peut planifier plusieurs rendez-vous, traçables via le champ `createdBy` (`userId`).
* **Index & Unicité** : Contrainte `UNIQUE` sur le CIN du patient et indexation des colonnes de recherche fréquente (`fullName`, `cin`, `appointmentDate`) pour des performances optimales.

---

## 🛠️ 2. Stack Technique
- **Base de données** : PostgreSQL (`clinicflow_db`)
- **Back-end** : Node.js, Express, JWT, BcryptJS, PG-Pool
- **Front-end** : React (Vite), Tailwind CSS, Lucide React, Axios

---

## ⚙️ 3. Installation et Lancement

### A. Configuration de la Base de Données
1. Crée une base de données PostgreSQL nommée `clinicflow_db`.
2. Exécute le script `schema.sql` fourni pour créer les tables et insérer les données de test (`seed`).

### B. Configuration du Back-end
1. Navigue dans le dossier `backend`.
2. Crée un fichier `.env` à la racine de `backend/` :
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=clinicflow_db
DB_PASSWORD=12345
DB_PORT=5432
JWT_SECRET=secret_key_clinicflow_2026
```
3. Installe les dépendances et lance le serveur :
```
cd backend
npm install
npm run dev
```

### C. Configuration du Front-end
1. Navigue dans le dossier `frontend`.
2. Installe les dépendances et lance l'application :
```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 4. Endpoints API REST

### Auth
* `POST /api/auth/login` : Connexion utilisateur et génération JWT.
* `GET /api/auth/me` : Récupération des détails de l'utilisateur connecté.

### Patients
* `POST /api/patients` : Création d'un patient.
* `GET /api/patients?search=&page=&limit=` : Liste paginée des patients avec recherche (`fullName` / `CIN`).
* `GET /api/patients/:id` : Informations d'un patient et liste de ses rendez-vous.
* `PUT /api/patients/:id` : Mise à jour d'un patient.
* `DELETE /api/patients/:id` : Suppression d'un patient (**Admin only**).

### Appointments
* `POST /api/appointments` : Création de RDV (Vérification stricte de l'intervalle de 30 min).
* `GET /api/appointments?date=&status=` : Liste et filtrage des rendez-vous.
* `PATCH /api/appointments/:id/status` : Mise à jour du statut (`pending`, `confirmed`, `cancelled`).

---

## 🔑 5. Comptes de Test (Seed)
* **Administrateur** : `admin@clinicflow.com` / `password123` *(Accès complet + Suppression patients)*
* **Staff 1** : `staff1@clinicflow.com` / `password123`
* **Staff 2** : `staff2@clinicflow.com` / `password123`