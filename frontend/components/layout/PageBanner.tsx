import Link from "next/link";

export function PageBanner({ title, description, eyebrow = "Incident Reporting & Resolution" }: { title: string; description?: string; eyebrow?: string }) {
  return (
    <section className="page-banner">
      <div className="site-width">
        <p className="breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {description ? <p className="page-banner-description">{description}</p> : null}
      </div>
    </section>
  );
}
