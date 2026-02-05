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
- **API**: Backend externe hébergé sur https://appmytools.replit.app (PWA backend)
- **Proxy Local**: Express server sur port 5000 qui proxie les requêtes vers le backend PWA
- **Authentification**: Session cookies via le proxy (même authentification que la PWA)

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
│   └── RootStackNavigator.tsx # Navigation racine avec auth
├── screens/
│   ├── LoginScreen.tsx
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

## Changements Récents

### Février 2026
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
