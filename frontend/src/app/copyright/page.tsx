import LegalPage from '@/components/LegalPage';

const sections = [
  {
    title: 'Ownership of Content',
    paragraphs: [
      'Unless otherwise stated, Go Seven owns or controls the storefront design, branding, logos, graphics, text, product media, layouts, and other original site content.',
      'This content is protected by copyright, trademark, and related intellectual property rules.',
    ],
  },
  {
    title: 'Permitted Use',
    paragraphs: [
      'You may view, browse, and reference site content for personal, non-commercial shopping purposes.',
      'No part of the site may be copied, reproduced, distributed, edited, republished, or commercially reused without prior written permission from Go Seven.',
    ],
  },
  {
    title: 'Brand and Logo Use',
    paragraphs: [
      'The Go Seven name, visual identity, logos, and brand assets may not be used in a way that suggests endorsement, partnership, resale rights, or brand ownership without permission.',
      'Unauthorized use of brand materials may result in removal requests or other protective action.',
    ],
  },
  {
    title: 'Third-Party Rights',
    paragraphs: [
      'Where third-party media, tools, or brand references appear on the site, those materials remain subject to their respective owners and license terms.',
    ],
  },
  {
    title: 'Questions or Reports',
    paragraphs: [
      'If you believe any content on the site infringes your rights or if you need permission for brand or content use, contact Go Seven through the available support channels.',
    ],
  },
];

export default function CopyrightPage() {
  return (
    <LegalPage
      title="Copyright Notice"
      intro="This page explains how Go Seven content, branding, and creative assets may be used and what protections apply to the storefront and its materials."
      sections={sections}
    />
  );
}
