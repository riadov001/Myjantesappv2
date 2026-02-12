# MyJantes - Application Mobile de Gestion de Garage

## Vue d'ensemble
MyJantes est une application mobile professionnelle pour la gestion de garages automobiles spécialisés dans les jantes et roues. L'application permet aux clients de gérer leurs devis, factures et réservations, tandis que les administrateurs peuvent suivre les analytics et gérer l'ensemble des opérations.

## Architecture Technique

### Frontend (Expo React Native)
- **Framework**: Expo SDK avec React Native
- **Navigation**: React Navigation 7+ (Stack + Bottom Tabs)
- **État & Cache**: TanStack Query (React Query)
- **Animations**: React Native Reanimated
- **UI**: Composants custom avec support dark mode

### Backend
- **API**: Backend externe hébergé sur https://appmyjantes.mytoolsgroup.eu (PWA backend)
- **Proxy Local**: Express server sur port 5000 qui proxie les requêtes vers le backend PWA
- **Authentification**: Session cookies via le proxy (même authentification que la PWA)
- **Temps réel**: Polling automatique toutes les 30s (10s pour les notifications)

### Structure des Dossiers
```
client/
├── App.tsx                    # Point d'entrée avec providers
├── components/                # Composants réutilisables
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   ├── HeaderTitle.tsx
│   ├── LoadingSkeleton.tsx
│   ├── StatCard.tsx
│   ├── StatusBadge.tsx
│   └── ThemedText/View.tsx
├── constants/
│   └── theme.ts               # Couleurs, spacing, typography
├── contexts/
│   └── AuthContext.tsx        # Gestion authentification
├── hooks/
│   ├── useApi.ts              # Hooks React Query pour API
│   ├── useTheme.ts
│   └── useScreenOptions.ts
├── navigation/
│   ├── ClientTabNavigator.tsx # Navigation client (5 tabs)
│   ├── AdminTabNavigator.tsx  # Navigation admin (5 tabs + more)
│   ├── EmployeeTabNavigator.tsx # Navigation employé (5 tabs)
│   └── RootStackNavigator.tsx # Navigation racine avec auth + rôles
├── screens/
│   ├── LoginScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── employee/
│   │   └── EmployeeProfileScreen.tsx
│   └── client/
│       ├── ClientDashboardScreen.tsx
│       ├── QuotesScreen.tsx
│       ├── QuoteDetailScreen.tsx
│       ├── InvoicesScreen.tsx
│       ├── InvoiceDetailScreen.tsx
│       ├── ReservationsScreen.tsx
│       └── ProfileScreen.tsx
├── types/
│   └── index.ts               # Types TypeScript
└── lib/
    └── query-client.ts        # Configuration React Query
```

## Configuration

### Variables d'Environnement
- `EXPO_PUBLIC_DOMAIN`: Domaine du proxy local (via REPLIT_DEV_DOMAIN:5000)

### Thème
- **Couleur primaire**: #dc2626 (Rouge MyJantes)
- **Support**: Mode clair et sombre automatique
- **Langue**: Français uniquement

## Fonctionnalités

### Espace Client
1. **Dashboard**: Résumé des devis, factures et réservations
2. **Devis**: Liste, filtres, détails, acceptation/refus
3. **Factures**: Liste, filtres, détails, suivi des paiements
4. **Réservations**: Liste, création, annulation
5. **Profil**: Informations utilisateur, notifications, déconnexion

### API Endpoints Utilisés
- `GET /api/user` - Utilisateur connecté
- `GET /api/quotes` - Liste des devis
- `GET /api/invoices` - Liste des factures
- `GET /api/reservations` - Liste des réservations
- `GET /api/notifications` - Notifications
- `GET /api/services` - Liste des services

## Commandes de Développement

### Démarrer l'application
```bash
npm run expo:dev    # Frontend Expo (port 8081)
npm run server:dev  # Backend Express (port 5000)
```

### Workflows
- **Start Frontend**: Lance le serveur Expo
- **Start Backend**: Lance le serveur Express

### Espace Administrateur
1. **Dashboard**: Analytics avancées, graphiques CA, activité récente
2. **Devis**: Création, modification, suppression, envoi email, upload photos
3. **Factures**: Gestion des paiements, envoi email avec popup éditable, upload photos
4. **Réservations**: Validation, annulation, assignation d'employés
5. **Planning**: Vue calendrier mensuelle, détails par jour, assignation employés
6. **Chat Interne**: Messagerie entre admin/superadmin/employés (base locale PostgreSQL)
7. **Utilisateurs**: Gestion des rôles (client, admin, superadmin, employee)
8. **Services/Prestations**: Création, modification, activation/désactivation
9. **Paramètres Garage**: Infos contact, horaires, préférences notifications

## Changements Récents

### Février 2026
- **Connexion Backend PWA**: URL mise à jour vers appmyjantes.mytoolsgroup.eu (même backend que la PWA)
- **Mot de passe oublié**: Écran dédié avec envoi de lien de réinitialisation
- **Rôle Employé**: Navigation dédiée avec planning, missions, chat, notifications et profil
- **Temps réel**: Polling automatique sur toutes les listes (30s données, 10s notifications)
- **Endpoints supplémentaires**: Mot de passe oublié, réinitialisation, suppression utilisateur, endpoints employé
- **Dashboard Admin Amélioré**:
  - Graphique en barres montrant l'évolution du CA sur 6 mois
  - Section activité récente avec derniers devis et réservations
  - Statistiques visuelles des statuts de factures
- **Upload de Photos**:
  - Sélection depuis la galerie (multi-select supporté)
  - Capture avec appareil photo (sur mobile)
  - Prévisualisation en grille avec suppression individuelle
  - Upload groupé vers le backend
  - Disponible pour devis ET factures
- **Page Paramètres Garage**:
  - Informations de contact (téléphone, email, site web)
  - Adresse complète du garage
  - Informations légales (SIRET, TVA)
  - Horaires d'ouverture par jour avec toggle ouvert/fermé
  - Préférences de notifications (push, email, SMS)
- **Email Popup (Factures)**:
  - Popup éditable avant envoi d'email
  - Champs objet et message personnalisables
  - Prévisualisation du contenu avant envoi
  - PDF automatiquement joint à l'email
- **Planning / Calendrier**:
  - Vue calendrier mensuelle avec navigation
  - Sélection de jour pour voir les réservations
  - Détails des réservations par jour
  - Assignation d'employés aux réservations
- **Chat Interne (Local)**:
  - Base de données PostgreSQL locale pour le chat
  - Conversations entre admin/superadmin/employés uniquement
  - Messages en temps réel avec historique
  - Indicateurs de conversation non lue
- **Espace Administrateur Complet**:
  - Dashboard avec analytics (CA, taux conversion, devis/factures/réservations en attente)
  - Gestion des devis (création, modification, suppression, envoi, upload photos)
  - Gestion des factures (création, paiement, envoi email popup, upload photos)
  - Gestion des réservations (validation, annulation, assignation employés)
  - Planning calendrier avec réservations et assignations
  - Gestion des utilisateurs (liste, modification des rôles)
  - Gestion des services (création, modification, activation/désactivation)
  - Chat interne entre staff
  - Notifications admin
  - Paramètres garage
- Navigation automatique admin/client basée sur le rôle utilisateur
- Connexion au backend PWA (appmytools.replit.app) via proxy local
- Authentification par email/mot de passe avec session cookies
- Parité complète des fonctionnalités avec la PWA
- Mêmes utilisateurs et données que la PWA

### Février 2025
- Création initiale de l'application MyJantes
- Implémentation de l'espace client complet
- Support dark mode et thème rouge
- Navigation bottom tabs avec 5 onglets

## Notes de Développement
- L'application utilise des composants iOS Liquid Glass style pour un look moderne
- Tous les écrans supportent le pull-to-refresh
- Skeleton loaders sur tous les écrans de liste
- Illustrations d'état vide personnalisées
- Feedback haptique sur les actions principales
