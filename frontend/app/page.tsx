import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicIncidentList } from "@/components/incidents/PublicIncidentList";
import { HomeIntroActions } from "@/components/home/HomeIntroActions";

export default function HomePage() {
  return (
    <>
      <section className="portal-introduction">
        <div className="site-width">
          <h1>Complaint &amp; suggestion management</h1>
          <p>
            Faculty of Management &amp; Commerce — report maintenance, security, and
            infrastructure issues, or submit suggestions. Sign in to submit a case and track
            its progress; browse public cases below after staff have marked them for viewing.
          </p>
          <HomeIntroActions />
        </div>
      </section>
      <section className="site-width incident-register">
        <div className="section-heading">
          <h2>Recent public complaints &amp; suggestions</h2>
          <Link href="/incidents">
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="section-intro">
          Complaints and suggestions marked public after review. Reporter details and internal
          notes stay private.
        </p>
        <PublicIncidentList limit={5} />
      </section>
    </>
  );
}
