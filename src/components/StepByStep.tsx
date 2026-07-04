import Image from "next/image";

import type { GuideStep } from "@/content/content-loader";

type StepByStepProps = {
  steps: readonly GuideStep[];
  title?: string;
};

export function StepByStep({ steps, title = "Step by step" }: StepByStepProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="steps-heading" className="guide-section">
      <h2 id="steps-heading">{title}</h2>
      <ol className="step-list">
        {steps.map((step, index) => (
          <li className="step-item" key={step.title}>
            <div className="step-item__number">{index + 1}</div>
            <div className="step-item__body">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.image ? (
                <figure className="step-item__figure">
                  <Image
                    alt={step.image.alt}
                    height={540}
                    src={step.image.src}
                    width={960}
                  />
                  {step.image.caption ? (
                    <figcaption>{step.image.caption}</figcaption>
                  ) : null}
                </figure>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
