import Link from 'next/link';

type LegalSection = {
  title: string;
  paragraphs: string[];
};

interface LegalPageProps {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export default function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/15 bg-white/8 p-6 backdrop-blur-sm sm:p-10">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">Legal</span>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/78 sm:text-lg">
            {intro}
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-white/10 bg-black/10 p-5 sm:p-6">
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-white/76 sm:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm text-white/70">
            <Link href="/collections" className="transition-colors hover:text-white">
              Back to collections
            </Link>
            <Link href="/" className="transition-colors hover:text-white">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
