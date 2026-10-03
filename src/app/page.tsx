import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Services from "@/components/Services";
import Work from "@/components/Work";
import Process from "@/components/Process";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { fetchLandingSettings } from "@/lib/settings";

export const revalidate = 30;

export default async function Home() {
  const s = await fetchLandingSettings();
  return <>
    <Navbar quoteUrl={s.links.quoteUrl} ctaLabel={s.hero.ctaLabel} branding={s.branding} />
    <main><Hero hero={s.hero} links={s.links} branding={s.branding} /><Marquee items={s.marquee} /><Services services={s.services} background={s.sectionBackgrounds.whatWeDo} /><Work projects={s.projects} /><Process /><Contact contact={s.contact} links={s.links} /></main>
    <Footer links={s.links} />
  </>;
}
