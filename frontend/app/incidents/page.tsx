import { PageContainer } from "@/components/layout/PageContainer";
import { PageBanner } from "@/components/layout/PageBanner";
import { PublicIncidentList } from "@/components/incidents/PublicIncidentList";
import { PUBLIC_REGISTER_TITLE } from "@/lib/terminology";

export default function IncidentsPage() {
  return (
    <>
      <PageBanner
        title={PUBLIC_REGISTER_TITLE}
        description="Browse FMSC complaints and suggestions that staff have marked for public viewing after review."
      />
      <PageContainer>
        <section className="py-10 md:py-14">
          <div className="mb-8 border-b border-border pb-5">
            <h2 className="text-[22px] font-semibold">Public register</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Only reviewed cases with public visibility appear here. Personal reporter
              information and internal review notes are never shown.
            </p>
          </div>
          <PublicIncidentList />
        </section>
      </PageContainer>
    </>
  );
}
