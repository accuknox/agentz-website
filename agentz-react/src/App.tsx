import { Analytics } from '@vercel/analytics/react'
import { useSiteEffects } from './hooks/useSiteEffects'
import { IconSprite } from './components/ui/Icon'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Comparison } from './components/Comparison'
import { WhyAgentZ } from './components/WhyAgentZ'
import { PlatformArch } from './components/PlatformArch'
import { Stepper } from './components/Stepper'
import { SeeInAction } from './components/SeeInAction'
import { OrgChart } from './components/OrgChart'
import { Integrations } from './components/Integrations'
import { Pricing } from './components/Pricing'
import { FAQ } from './components/FAQ'
import { Footer } from './components/Footer'

export default function App() {
  useSiteEffects()

  return (
    <>
      <IconSprite />

      {/* the nav carries the wordmark and the theme toggle now, so the floating
          brand mark and dock that used to sit in those corners are gone */}
      <Nav />

      <div className="scrollbar" aria-hidden="true">
        <span id="scrollbar-fill"></span>
      </div>

      <main id="top">
        <Hero />
        <WhyAgentZ />
        <Stepper />
        <PlatformArch />
        <SeeInAction />
        <Comparison />
        <OrgChart />
        <Integrations />
        <Pricing />
        <FAQ />
        <Footer />
      </main>

      <Analytics />
    </>
  )
}
