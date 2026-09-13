import { PageContainer } from "@/components/layout/PageContainer";
import { PageBanner } from "@/components/layout/PageBanner";
import { PublicIncidentList } from "@/components/incidents/PublicIncidentList";

export default function IncidentsPage() {
  return <><PageBanner title="Public incidents" description="Browse verified reports and follow the progress of issues across the university." /><PageContainer><section className="py-10 md:py-14"><div className="mb-8 border-b border-border pb-5"><h2 className="text-[22px] font-semibold">Public incident register</h2><p className="mt-2 text-sm text-text-secondary">Only verified incidents marked for public viewing are listed here. Reporter details and internal review information remain private.</p></div><PublicIncidentList /></section></PageContainer></>;
}
