import { AppHeader } from "@/components/app-header";
import { ExploreMap } from "./explore-map";

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ place?: string }> }) {
  const params = await searchParams;
  return (
    <main className="explore-shell">
      <AppHeader />
      <ExploreMap initialPlaceId={params.place} />
    </main>
  );
}
