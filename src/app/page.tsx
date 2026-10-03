import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Work from "@/components/Work";
import Services from "@/components/Services";
import Process from "@/components/Process";
import About from "@/components/About";
import Trust from "@/components/Trust";
import Contact from "@/components/Contact";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";
import { fetchLandingSettings } from "@/lib/settings";

export const revalidate = 30;

export default async function Home() {
  const s = await fetchLandingSettings();
  // Hero photo: the one set in Builder Settings, otherwise the first real project photo.
  const heroPhoto = s.hero.backgroundImage || s.projects.find((p) => p.image)?.image || "";
  return (
    <>
      <Navbar quoteUrl={s.links.quoteUrl} ctaLabel={s.hero.ctaLabel} branding={s.branding} />
      <main>
        <Hero hero={s.hero} links={s.links} photo={heroPhoto} />
        <Marquee items={s.marquee} />
        <Work projects={s.projects} />
        <Services services={s.services} />
        <Process />
        <About branding={s.branding} stats={s.stats} />
        <Trust clients={s.clients} />
        <Contact contact={s.contact} links={s.links} />
        <Closing />
      </main>
      <Footer links={s.links} />
    </>
  );
}
