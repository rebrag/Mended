import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PomegranateTree } from "@/components/art/pomegranate-tree";
import { VesselArt } from "@/components/art/vessel-art";
import { isTestMode } from "@/lib/clock";
import { VESSEL_SHAPES } from "@/lib/game/vessel-shapes";

/** Test-only gallery for tuning the art at every stage. */
export default function VesselGallery() {
  return (
    <Suspense>
      <Gallery />
    </Suspense>
  );
}

async function Gallery() {
  await connection();
  if (!isTestMode()) notFound();
  const stages = [0, 1, 6, 12, 17, 18];
  return (
    <main className="space-y-6 p-4">
      {VESSEL_SHAPES.map((shape) => (
        <section key={shape}>
          <h2 className="font-semibold">{shape}</h2>
          <div className="grid grid-cols-3 gap-2">
            {stages.map((mended) => (
              <figure key={mended} className="rounded-xl border border-line p-1">
                <VesselArt shape={shape} seed={`gallery-${shape}`} mended={mended} className="w-full" />
                <figcaption className="text-center text-[12px]">{mended}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="font-semibold">tree</h2>
        <div className="grid grid-cols-4 gap-2">
          {[0, 0.3, 0.6, 1].map((g) => (
            <PomegranateTree key={g} growth={g} fruit={Math.round(g * 12)} seed="gallery" className="w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
