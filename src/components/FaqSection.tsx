import type { FaqItem } from "@/content/content-loader";

type FaqSectionProps = {
  faq: readonly FaqItem[];
};

export function FaqSection({ faq }: FaqSectionProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
      name: item.q,
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="guide-section">
      <h2 id="faq-heading">FAQ</h2>
      <div className="faq-list">
        {faq.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        type="application/ld+json"
      />
    </section>
  );
}
