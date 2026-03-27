import LegalPage from '@/components/LegalPage';

const sections = [
  {
    title: 'Use of This Store',
    paragraphs: [
      'By using Go Seven, you agree to browse and shop in a lawful and respectful way. You may not use the site to interfere with operations, access restricted areas, or misuse customer or product information.',
      'We may update, suspend, or change parts of the storefront, product catalog, pricing, or policies when necessary.',
    ],
  },
  {
    title: 'Products, Pricing, and Availability',
    paragraphs: [
      'Product images, sizes, and descriptions are provided as accurately as possible, but minor variations in color, texture, or presentation may happen depending on screens and production batches.',
      'Stock availability can change without notice. A product shown on the site is not guaranteed to remain available until an order is confirmed.',
    ],
  },
  {
    title: 'Orders and Payments',
    paragraphs: [
      'When you place an order, you confirm that the details you provide are accurate and complete. Orders may be reviewed, accepted, or declined if there is a pricing issue, stock issue, or suspected misuse.',
      'Payment must be completed through the available checkout methods before an order can be processed.',
    ],
  },
  {
    title: 'Shipping, Returns, and Support',
    paragraphs: [
      'Delivery timelines may vary based on destination, courier performance, and stock handling. Estimated delivery dates are not guaranteed unless clearly stated.',
      'If you need help with an order, size, or availability, contact Go Seven through the support channels listed in the footer or WhatsApp support area.',
    ],
  },
  {
    title: 'Liability',
    paragraphs: [
      'To the maximum extent permitted by law, Go Seven is not liable for indirect, incidental, or consequential losses related to site use, order delays, third-party services, or temporary unavailability.',
      'These terms are intended for basic storefront use and may be updated over time as operations evolve.',
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These terms govern your use of the Go Seven storefront, products, and related services. By browsing or placing an order, you agree to follow these conditions."
      sections={sections}
    />
  );
}
