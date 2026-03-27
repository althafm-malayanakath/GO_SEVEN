import LegalPage from '@/components/LegalPage';

const sections = [
  {
    title: 'Information We Collect',
    paragraphs: [
      'Go Seven may collect information you provide directly, such as your name, email address, phone number, shipping details, order details, and account preferences.',
      'We may also collect technical information related to site usage, device behavior, and session activity for store performance and security.',
    ],
  },
  {
    title: 'How We Use Information',
    paragraphs: [
      'We use customer information to process orders, manage accounts, respond to enquiries, provide support, and improve the storefront experience.',
      'Information may also be used for fraud prevention, operational analytics, and service communications related to purchases or support requests.',
    ],
  },
  {
    title: 'Sharing and Service Providers',
    paragraphs: [
      'Customer information may be shared with trusted third-party providers only where needed to operate the storefront, such as payment, hosting, delivery, messaging, or analytics services.',
      'We do not sell personal information as part of normal storefront operations.',
    ],
  },
  {
    title: 'Data Security and Retention',
    paragraphs: [
      'We take reasonable technical and operational steps to protect stored information, but no system can guarantee absolute security.',
      'Information is retained only as long as needed for store operations, support, compliance, dispute resolution, or legitimate business records.',
    ],
  },
  {
    title: 'Your Choices',
    paragraphs: [
      'You may contact Go Seven to request updates to your account or order information where applicable.',
      'If you no longer wish to receive optional communications, you can opt out through available settings or direct contact channels.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This page explains how Go Seven collects, uses, stores, and protects customer information when you browse the site, create an account, place an order, or contact support."
      sections={sections}
    />
  );
}
