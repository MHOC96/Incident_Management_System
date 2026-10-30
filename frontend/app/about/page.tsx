import Link from "next/link";
import { PageBanner } from "@/components/layout/PageBanner";

const steps = [
  [
    "Submit",
    "Students and lecturers sign in to file a complaint or suggestion, add location and details, attach optional photo or video evidence, and confirm the declaration.",
  ],
  [
    "Review",
    "The FMSC Administrator reviews the case, accepts it (not started) or rejects it with a reason.",
  ],
  [
    "Assign",
    "The Administrator assigns a Relevant Authority (maintenance, security, etc.) and sets official priority.",
  ],
  [
    "Resolve",
    "The assigned authority updates progress and marks the case solved with a mandatory resolution note.",
  ],
  [
    "Close",
    "The Administrator reviews the outcome and closes the case.",
  ],
];

export default function AboutPage() {
  return (
    <>
      <PageBanner title="About the service" />
      <section className="site-width service-description">
        <h2>FMSC complaint &amp; suggestion management</h2>
        <p>
          This is the official Faculty of Management &amp; Commerce system for reporting
          maintenance, security, infrastructure, and related issues, and for submitting
          suggestions. It follows a controlled workflow from submission through
          administrator review, assignment, resolution, and closure.
        </p>

        <h2 className="mt-10">How a case moves through the system</h2>
        <ol className="workflow-list">
          {steps.map(([title, description], index) => (
            <li key={title}>
              <span className="workflow-step-number" aria-label={`Step ${index + 1}`}>
                <span className="workflow-step-digit workflow-step-digit-leading" aria-hidden="true">
                  0
                </span>
                <span className="workflow-step-digit workflow-step-digit-unit" aria-hidden="true">
                  {index + 1}
                </span>
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10">Public complaints &amp; suggestions</h2>
        <p>
          After review, some cases may be marked <strong>public</strong>. Those appear on the{" "}
          <Link href="/incidents" className="font-medium text-primary hover:text-primary-dark">
            public complaints &amp; suggestions register
          </Link>{" "}
          and on the homepage. They show case summary, status, and progress only — never
          reporter names, MC numbers, phone numbers, or internal staff notes. Most cases
          remain private to authorized staff and the reporter.
        </p>

        <p className="mt-6">
          To report a new case,{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
            sign in
          </Link>{" "}
          with your student or staff credentials.
        </p>
      </section>
    </>
  );
}
