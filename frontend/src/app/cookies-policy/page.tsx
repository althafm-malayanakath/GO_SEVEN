import LegalPage from '@/components/LegalPage';

const sections = [
  {
    title: 'What Cookies Are',
    paragraphs: [
      'Cookies are small data files placed on your device to help websites remember preferences, keep sessions active, and measure how pages are being used.',
      'Go Seven may also use similar storage technologies where needed for storefront functionality and performance.',
    ],
  },
  {
    title: 'How We Use Cookies',
    paragraphs: [
      'Cookies may be used to support essential storefront behavior such as session continuity, cart behavior, sign-in state, and basic site performance.',
      'They may also be used to understand how visitors interact with pages so the storefront can be improved over time.',
    ],
  },
  {
    title: 'Third-Party Services',
    paragraphs: [
      'Some cookies or related technologies may come from trusted third-party services used for hosting, analytics, security, payments, or embedded functionality.',
      'Those providers may manage their own cookie behavior according to their own policies.',
    ],
  },
  {
    title: 'Managing Cookies',
    paragraphs: [
      'Most browsers allow you to review, block, or delete cookies through browser settings.',
      'If you disable certain cookies, some parts of the storefront may not function as expected, including sign-in, saved preferences, or cart-related behavior.',
    ],
  },
  {
    title: 'Policy Updates',
    paragraphs: [
      'This cookies policy may be updated when storefront functionality, third-party services, or legal requirements change.',
    ],
  },
];

export default function CookiesPolicyPage() {
  return (
    <LegalPage
      title="Cookies Policy"
      intro="This page explains how Go Seven uses cookies and similar technologies to operate the storefront, improve performance, and support a smoother shopping experience."
      sections={sections}
    />
  );
}
