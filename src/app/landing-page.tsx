import Link from "next/link"
import { ArrowRight, Play, Check, Package, Truck, Camera, Shield, Zap, Users, FileSpreadsheet, MessageCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <PainSection />
      <HowItWorks />
      <StaffSimplicity />
      <DamageProof />
      <SmartBriefing />
      <SetupSection />
      <PricingSection />
      <FaqSection />
      <FinalCta />
      <footer className="border-t"><div className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-muted-foreground">LoadLoop — Equipment control for rental teams</div></footer>
    </div>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur border-b z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <span className="text-xl font-bold tracking-tight">LoadLoop</span>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works">How it works</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/login" className="text-sm font-medium bg-foreground text-background rounded-full px-5 py-2 hover:opacity-90 transition-opacity">Request setup</Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-1.5 text-xs font-medium mb-6">
            Equipment control for rental teams
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight leading-tight">
            Know what left the warehouse, what came back, and what needs attention.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-lg">
            LoadLoop helps event, AV, and equipment rental teams control bookings, packing, dispatch, returns, missing items, and damage proof without making staff log into a complicated dashboard.
          </p>
          <div className="flex items-center gap-4 mt-8">
            <Link href="#demo" className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
              <Play className="h-4 w-4" /> Watch 3-minute demo
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border hover:bg-muted/50 transition-colors">
              Request setup
            </Link>
          </div>
        </div>
        <div className="relative">
          <WorkflowAnimation />
        </div>
      </div>
    </section>
  )
}

function WorkflowAnimation() {
  const steps = [
    { label: "Booked", color: "bg-blue-500", data: "Meridian Gala · Sony Projector" },
    { label: "Packed", color: "bg-indigo-500", data: "Packed by Tom · 8 items confirmed" },
    { label: "Out", color: "bg-amber-500", data: "Value at risk: $12,400 · 3 active bookings" },
    { label: "Returned", color: "bg-emerald-500", data: "4 good · 1 damaged · 2 returned" },
    { label: "Review", color: "bg-red-500", data: "Needs action: 3 · Damaged: 2 blocked" },
  ]

  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        Apex AV Rentals — Live dashboard
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-xl font-bold text-blue-700">26</p><p className="text-xs text-blue-600">Available</p></div>
        <div className="rounded-lg bg-amber-50 p-3 text-center"><p className="text-xl font-bold text-amber-700">9</p><p className="text-xs text-amber-600">Out</p></div>
        <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-xl font-bold text-red-700">3</p><p className="text-xs text-red-600">Need action</p></div>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 200}ms` }}>
            <div className={`h-3 w-3 rounded-full ${step.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{step.data}</p>
            </div>
            {i < steps.length - 1 && <div className="h-6 w-px bg-border mx-1" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-16">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-lg text-muted-foreground mt-4">{subtitle}</p>}
    </div>
  )
}

function PainSection() {
  const pains = [
    { title: "Double-booked equipment", desc: "Same projector booked for two events on the same day. LoadLoop catches conflicts before they happen." },
    { title: "WhatsApp packing chaos", desc: "Staff receive packing lists as WhatsApp messages, then nothing gets confirmed in writing." },
    { title: "Damaged items sent out again", desc: "A cracked screen gets packed for the next job because nobody flagged it as damaged." },
    { title: "Missing items noticed too late", desc: "A wireless mic kit goes missing. Nobody reports it until the next event needs it." },
    { title: "No proof for damage disputes", desc: "Client says the screen was already cracked. Owner has no photo, no date, no evidence." },
    { title: "Owner keeps asking for updates", desc: "Calls, messages, memory — instead of one dashboard that tells the whole story." },
  ]

  return (
    <section className="border-t bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <SectionHeader title="Rental teams lose money in the gaps." />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map((p) => (
            <div key={p.title} className="rounded-xl border bg-card p-6 hover:shadow-sm transition-shadow">
              <h3 className="font-semibold text-sm mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { step: "1", icon: FileSpreadsheet, title: "Import your equipment list", desc: "Send us your spreadsheet. We import it into LoadLoop with categories, values, and quantities." },
    { step: "2", icon: Zap, title: "Create a booking", desc: "Select a client, pick equipment, set delivery and return dates. LoadLoop checks for conflicts." },
    { step: "3", icon: MessageCircle, title: "Send staff a phone link", desc: "Copy the packing link, send it via WhatsApp. Staff open it on their phone — no account needed." },
    { step: "4", icon: Check, title: "Staff tap or scan items", desc: "Staff mark items as packed or returned. Damaged items get photo evidence and repair estimates." },
    { step: "5", icon: Shield, title: "Owner sees issues instantly", desc: "Dashboard updates immediately. Damaged items are blocked. Missing items are flagged." },
  ]

  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader title="From booking to return, every item has a trail." />
      <div className="space-y-6">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-4 items-start group">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold group-hover:bg-foreground group-hover:text-background transition-colors">
              {s.step}
            </div>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StaffSimplicity() {
  return (
    <section className="border-t bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Staff do not need another dashboard.</h2>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
              Staff open a mobile link, enter their name once, then tap or scan items as packed, good, damaged, missing, or needs inspection. No training required.
            </p>
            <ul className="mt-6 space-y-3">
              {["Open WhatsApp link on any phone", "Enter first name once — phone remembers it", "Tap items to mark them packed or returned", "Scan QR codes on high-value items", "Report damage with photo and repair estimate"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 max-w-xs mx-auto">
            <div className="text-center space-y-1 mb-4">
              <Package className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold">Pack &amp; Dispatch</p>
              <p className="text-xs text-muted-foreground">Meridian Gala · Deliver Jun 12</p>
            </div>
            <div className="space-y-2">
              {["Sony Projector ✓", "JBL Speaker Pair ✓", "Wireless Mic Kit ✓", "Cable Case A ✓", "Folding Chairs × 40"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>
                  <span className={item.includes("✓") ? "" : "text-muted-foreground"}>{item.replace(" ✓", "")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between text-xs text-muted-foreground">
              <span>5 of 5 confirmed</span>
              <span>Packed by Tom</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DamageProof() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <div className="rounded-2xl border bg-card p-6 max-w-sm">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold text-amber-700">Report Damage</span></div>
            <p className="text-sm font-medium mb-2">Projection Screen — Meridian Gala</p>
            <p className="text-xs text-muted-foreground mb-3">Cracked frame after return. Lower right corner bent.</p>
            <div className="rounded-lg bg-muted h-24 flex items-center justify-center text-xs text-muted-foreground mb-3">📸 Damage photo</div>
            <div className="flex justify-between text-xs"><span>Repair estimate</span><span className="font-medium">$180</span></div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-3xl font-bold tracking-tight">Damage proof before arguments start.</h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            When equipment comes back damaged, staff add a note, photo, and repair estimate. LoadLoop keeps the item blocked until the owner reviews it. No more "it was already cracked" disputes.
          </p>
        </div>
      </div>
    </section>
  )
}

function SmartBriefing() {
  return (
    <section className="border-t bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-700 mb-6">Coming soon</div>
        <h2 className="text-3xl font-bold tracking-tight">Smart owner briefing.</h2>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
          LoadLoop will summarize what needs attention each day — overdue returns, missing items, damaged equipment, and bookings that still need packing. It can also help draft follow-up messages for clients over WhatsApp.
        </p>
        <div className="mt-8 max-w-md mx-auto rounded-xl border bg-card p-4 text-left text-sm space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Today&apos;s briefing</p>
          <p className="text-xs">2 returns due today · 1 item missing · 3 damaged items blocked · 1 job waiting to be packed</p>
          <p className="text-xs text-amber-700">Priority: Do not dispatch the cracked Projection Screen. Follow up on missing Wireless Mic Kit from Meridian Gala.</p>
        </div>
      </div>
    </section>
  )
}

function SetupSection() {
  const cards = [
    { title: "Starter setup", desc: "Import your asset list. Categories, values, quantities. QR labels generated.", price: "From $750" },
    { title: "Workflow setup", desc: "Bookings, staff packing links, return checks, damage proof. Full demo walkthrough.", price: "From $1,500" },
    { title: "Custom system", desc: "Tailored workflows, QR labels, reporting, custom categories. White-glove onboarding.", price: "From $3,000" },
  ]

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader title="Send your spreadsheet. Get a working equipment control system." subtitle="We help small rental teams turn their equipment spreadsheet into a configured workspace in 48 hours." />
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border p-6 text-center hover:shadow-sm transition-shadow">
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">{c.desc}</p>
            <p className="text-lg font-bold">{c.price}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PricingSection() {
  const cards = [
    { title: "Setup Sprint", price: "From $750", desc: "Import assets, configure workspace, demo training" },
    { title: "Operations Buildout", price: "From $1,500", desc: "Bookings, staff links, return checks, damage proof" },
    { title: "Custom System", price: "From $3,000", desc: "Tailored workflows, QR labels, reporting, custom setup" },
  ]

  return (
    <section id="pricing" className="border-t bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <SectionHeader title="Simple service pricing." subtitle="Final pricing depends on inventory size, workflow complexity, and setup support needed." />
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-6 text-center hover:shadow-sm transition-shadow">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-2xl font-bold mt-2">{c.price}</p>
              <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const faqs = [
    { q: "Do staff need to create accounts?", a: "No. Staff can use secure mobile links for packing and returns. They just enter their first name once." },
    { q: "Do we need photos of every item?", a: "No. You can start with a spreadsheet. Photos are useful for high-value items and required for damage proof." },
    { q: "Does this replace invoicing?", a: "No. LoadLoop focuses on equipment control after a job is confirmed. Invoicing and payment stay in your current tools." },
    { q: "Can we import our spreadsheet?", a: "Yes. LoadLoop supports CSV/TSV import with automatic column mapping and duplicate detection." },
    { q: "Is the smart briefing live?", a: "The owner briefing is planned as the next layer. The current system already tracks bookings, packing, returns, damage, and missing items." },
  ]

  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <SectionHeader title="Frequently asked questions." />
      <div className="space-y-4">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-xl border p-5">
            <h3 className="font-semibold text-sm">{f.q}</h3>
            <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="border-t bg-foreground text-background">
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Stop tracking rental equipment from memory.</h2>
        <p className="text-lg text-background/60 mt-4">Watch a 3-minute demo or request a setup. Your equipment spreadsheet becomes a working control system in 48 hours.</p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="#demo" className="inline-flex items-center gap-2 bg-background text-foreground rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"><Play className="h-4 w-4" /> Watch demo</Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border border-background/20 hover:bg-background/10 transition-colors">Request setup <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  )
}
