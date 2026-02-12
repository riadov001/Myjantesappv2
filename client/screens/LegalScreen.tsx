import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

type TabKey = 'garanties' | 'confidentialite' | 'cgv';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'garanties', label: 'Garanties' },
  { key: 'confidentialite', label: 'Confidentialit\u00e9' },
  { key: 'cgv', label: 'CGV' },
];

function NumberCircle({ num, color }: { num: number; color: string }) {
  return (
    <View style={[styles.numberCircle, { backgroundColor: `${color}15` }]}>
      <ThemedText type="body" style={{ color, fontWeight: '700' }}>
        {num}
      </ThemedText>
    </View>
  );
}

function GarantiesContent({ theme }: { theme: any }) {
  return (
    <View style={styles.contentContainer}>
      <ThemedText type="h3" style={styles.title}>Garanties</ThemedText>
      <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Chez Myjantes : Qualit\u00e9 exceptionnelle, garantie totale.
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Bienvenue dans notre section Garantie \u2013 R\u00e9novation de Jantes en Aluminium
        </ThemedText>
        <ThemedText type="body" style={styles.bodyText}>
          Chez Myjantes, nous comprenons l'importance de vos jantes en aluminium, non seulement en termes de performance, mais aussi en tant qu'\u00e9l\u00e9ment esth\u00e9tique essentiel de votre v\u00e9hicule. C'est pourquoi nous mettons \u00e0 votre disposition notre engagement in\u00e9branlable envers la qualit\u00e9 et la satisfaction client \u00e0 travers notre garantie de r\u00e9novation de jantes.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Notre Processus de R\u00e9novation</ThemedText>
        {[
          { title: '\u00c9valuation Expertise', body: 'D\u00e8s r\u00e9ception de vos jantes, notre \u00e9quipe d\'experts effectue une \u00e9valuation approfondie pour identifier les dommages, la corrosion et d\'autres imperfections.' },
          { title: 'Nettoyage Professionnel', body: 'Nous utilisons des techniques de nettoyage avanc\u00e9es pour \u00e9liminer la salet\u00e9, les r\u00e9sidus de freinage et les contaminants.' },
          { title: 'R\u00e9paration Pr\u00e9cise', body: 'Toute imperfection, rayure ou fissure est trait\u00e9e avec une pr\u00e9cision chirurgicale.' },
          { title: 'Application de Rev\u00eatement Sp\u00e9cialis\u00e9', body: 'Nous utilisons des rev\u00eatements de la plus haute qualit\u00e9 pour prot\u00e9ger vos jantes.' },
        ].map((item, index) => (
          <Card key={index} style={StyleSheet.flatten([styles.numberedCard, { backgroundColor: theme.backgroundDefault }])}>
            <View style={styles.numberedRow}>
              <NumberCircle num={index + 1} color={theme.primary} />
              <View style={styles.numberedContent}>
                <ThemedText type="h4">{item.title}</ThemedText>
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  {item.body}
                </ThemedText>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Notre Garantie</ThemedText>
        <ThemedText type="body" style={styles.bodyText}>
          Chez Myjantes, nous sommes fiers de la qualit\u00e9 de notre travail. C'est pourquoi chaque r\u00e9novation de jantes est accompagn\u00e9e d'une garantie compl\u00e8te.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Pourquoi Nous Choisir</ThemedText>
        {[
          'Expertise In\u00e9gal\u00e9e',
          'Service Client Exceptionnel',
          'R\u00e9sultats Durables',
        ].map((item, index) => (
          <Card key={index} style={StyleSheet.flatten([styles.numberedCard, { backgroundColor: theme.backgroundDefault }])}>
            <View style={styles.numberedRow}>
              <NumberCircle num={index + 1} color={theme.primary} />
              <View style={styles.numberedContent}>
                <ThemedText type="h4">{item}</ThemedText>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </View>
  );
}

function ConfidentialiteContent({ theme }: { theme: any }) {
  const sections = [
    { title: 'Collecte des donn\u00e9es', body: 'MyJantes collecte uniquement les donn\u00e9es n\u00e9cessaires au fonctionnement du service : nom, pr\u00e9nom, adresse email, num\u00e9ro de t\u00e9l\u00e9phone, adresse postale et informations relatives aux v\u00e9hicules. Ces donn\u00e9es sont collect\u00e9es lors de la cr\u00e9ation de votre compte et lors de l\'utilisation de nos services.' },
    { title: 'Utilisation des donn\u00e9es', body: 'Vos donn\u00e9es personnelles sont utilis\u00e9es exclusivement pour : la gestion de votre compte client, le traitement de vos devis et factures, la gestion de vos r\u00e9servations, l\'envoi de notifications relatives \u00e0 vos prestations, l\'am\u00e9lioration de nos services.' },
    { title: 'Protection des donn\u00e9es', body: 'Nous mettons en \u0153uvre des mesures de s\u00e9curit\u00e9 techniques et organisationnelles appropri\u00e9es pour prot\u00e9ger vos donn\u00e9es personnelles contre tout acc\u00e8s non autoris\u00e9, modification, divulgation ou destruction.' },
    { title: 'Vos droits', body: 'Conform\u00e9ment au RGPD, vous disposez des droits suivants : droit d\'acc\u00e8s, droit de rectification, droit \u00e0 l\'effacement, droit \u00e0 la portabilit\u00e9, droit d\'opposition. Pour exercer vos droits, contactez-nous \u00e0 contact@myjantes.fr.' },
    { title: 'Cookies', body: 'L\'application MyJantes utilise des cookies de session n\u00e9cessaires au bon fonctionnement du service. Aucun cookie publicitaire ou de suivi n\'est utilis\u00e9.' },
    { title: 'Contact', body: 'Pour toute question relative \u00e0 la protection de vos donn\u00e9es personnelles, contactez-nous : Email : contact@myjantes.fr' },
  ];

  return (
    <View style={styles.contentContainer}>
      <ThemedText type="h3" style={styles.title}>Politique de Confidentialit\u00e9</ThemedText>
      {sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>{section.title}</ThemedText>
          <ThemedText type="body" style={styles.bodyText}>{section.body}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function CGVContent({ theme }: { theme: any }) {
  const articles = [
    { title: 'Article 1 - Objet', body: 'Les pr\u00e9sentes conditions g\u00e9n\u00e9rales de vente r\u00e9gissent les relations contractuelles entre la soci\u00e9t\u00e9 MyJantes et ses clients, dans le cadre de prestations de r\u00e9novation et d\'entretien de jantes en aluminium.' },
    { title: 'Article 2 - Devis et Commandes', body: 'Tout devis \u00e9tabli par MyJantes est valable 30 jours. L\'acceptation du devis par le client vaut commande ferme. Les prix indiqu\u00e9s sont en euros TTC.' },
    { title: 'Article 3 - Tarifs', body: 'Les tarifs des prestations sont ceux en vigueur au moment de l\'\u00e9tablissement du devis. MyJantes se r\u00e9serve le droit de modifier ses tarifs \u00e0 tout moment, les prestations \u00e9tant factur\u00e9es sur la base des tarifs en vigueur au moment de la commande.' },
    { title: 'Article 4 - Paiement', body: 'Le paiement est exigible \u00e0 la livraison des prestations. Les moyens de paiement accept\u00e9s sont : carte bancaire, virement bancaire, esp\u00e8ces. Tout retard de paiement entra\u00eenera l\'application de p\u00e9nalit\u00e9s de retard.' },
    { title: 'Article 5 - D\u00e9lais', body: 'Les d\u00e9lais de r\u00e9alisation sont donn\u00e9s \u00e0 titre indicatif. MyJantes s\'engage \u00e0 informer le client de tout retard \u00e9ventuel dans la r\u00e9alisation des prestations.' },
    { title: 'Article 6 - Garantie', body: 'Toutes les prestations de r\u00e9novation de jantes b\u00e9n\u00e9ficient d\'une garantie de 12 mois. Cette garantie couvre les d\u00e9fauts de fabrication et les malfa\u00e7ons.' },
    { title: 'Article 7 - Responsabilit\u00e9', body: 'La responsabilit\u00e9 de MyJantes est limit\u00e9e au montant de la prestation. MyJantes ne saurait \u00eatre tenu responsable des dommages indirects.' },
    { title: 'Article 8 - Litiges', body: 'En cas de litige, les parties s\'engagent \u00e0 rechercher une solution amiable. \u00c0 d\u00e9faut, le litige sera soumis aux tribunaux comp\u00e9tents.' },
    { title: 'Article 9 - Donn\u00e9es personnelles', body: 'Le traitement des donn\u00e9es personnelles est r\u00e9gi par notre Politique de Confidentialit\u00e9, accessible dans l\'application.' },
  ];

  return (
    <View style={styles.contentContainer}>
      <ThemedText type="h3" style={styles.title}>Conditions G\u00e9n\u00e9rales de Vente</ThemedText>
      {articles.map((article, index) => (
        <View key={index} style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>{article.title}</ThemedText>
          <ThemedText type="body" style={styles.bodyText}>{article.body}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export default function LegalScreen() {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const initialTab: TabKey = route.params?.initialTab || 'garanties';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'garanties':
        return <GarantiesContent theme={theme} />;
      case 'confidentialite':
        return <ConfidentialiteContent theme={theme} />;
      case 'cgv':
        return <CGVContent theme={theme} />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isActive ? theme.primary : theme.backgroundDefault,
                  },
                ]}
                testID={`tab-${tab.key}`}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: isActive ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: '600',
                  }}
                >
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {renderContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tabButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  contentContainer: {
    gap: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  bodyText: {
    lineHeight: 24,
  },
  numberedCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  numberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberedContent: {
    flex: 1,
  },
});
