import Link from "next/link"
import { ArrowRight, Play, Check, Package, Truck, Camera, Shield, Zap, FileSpreadsheet, MessageCircle } from "lucide-react"

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
          <a href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link href="/login" className="text-sm font-medium bg-foreground text-background rounded-full px-5 py-2 hover:opacity-90">Try the demo</Link>
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
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-1.5 text-xs font-medium mb-6">Equipment control for rental teams</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Know what left, what came back, and what needs attention.</h1>
          <p className="text-lg text-muted-foreground mt-6 leading-relaxed max-w-lg">LoadLoop turns your equipment spreadsheet into a simple mobile workflow. Staff use phone links. You see the dashboard.</p>
          <div className="flex items-center gap-4 mt-8">
            <Link href="#demo" className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium hover:opacity-90"><Play className="h-4 w-4" />Watch 3-minute demo</Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border hover:bg-muted/50">Try the demo <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <WorkflowAnimation />
      </div>
    </section>
  )
}

function WorkflowAnimation() {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Apex AV Rentals — Live
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-blue-50 p-3 text-center"><p className="text-xl font-bold text-blue-700">26</p><p className="text-xs text-blue-600">Available</p></div>
        <div className="rounded-lg bg-amber-50 p-3 text-center"><p className="text-xl font-bold text-amber-700">9</p><p className="text-xs text-amber-600">Out</p></div>
        <div className="rounded-lg bg-red-50 p-3 text-center"><p className="text-xl font-bold text-red-700">3</p><p className="text-xs text-red-600">Need action</p></div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-blue-500" /><span>Sony Projector — Booked</span></div>
        <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-indigo-500" /><span>Packed by Tom · 8 confirmed</span></div>
        <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-amber-500" /><span>$12,400 value at risk</span></div>
        <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-emerald-500" /><span>Returned: 4 good · 1 damaged</span></div>
        <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-red-500" /><span>2 items blocked · 3 need action</span></div>
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
    { title: "Double-booked equipment", desc: "Same projector, two events, same day." },
    { title: "WhatsApp packing chaos", desc: "Lists sent as messages. Nothing confirmed." },
    { title: "Damaged gear sent out again", desc: "Cracked screen packed because nobody knew." },
    { title: "Missing items found too late", desc: "Mic kit gone. Noticed when next job needs it." },
    { title: "No proof for disputes", desc: "Client says it was already broken. No photo, no date." },
    { title: "Owner keeps asking around", desc: "Calls, texts, guesswork. Instead of one dashboard." },
  ]

  return (
    <section className="border-t bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <SectionHeader title="Rental teams lose money in the gaps." />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map((p) => (
            <div key={p.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: FileSpreadsheet, title: "Import your gear list", desc: "Send your spreadsheet. We set it up." },
    { icon: Zap, title: "Create a booking", desc: "Pick client and equipment. System checks availability." },
    { icon: MessageCircle, title: "Send a phone link", desc: "Staff open it. No account needed." },
    { icon: Check, title: "Staff tap to confirm", desc: "Pack items. Mark returns. Snap damage photos." },
    { icon: Shield, title: "You see everything", desc: "Dashboard updates. Damaged items blocked. Missing flagged." },
  ]

  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader title="From booking to return, every item tracked." />
      <div className="space-y-6">
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-4 items-start group">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold group-hover:bg-foreground group-hover:text-background transition-colors">{i + 1}</div>
            <div><h3 className="font-semibold">{s.title}</h3><p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p></div>
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
            <h2 className="text-3xl font-bold tracking-tight">Staff don&apos;t need a dashboard.</h2>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">They open a link, enter their name once, then tap or scan. Done.</p>
            <ul className="mt-6 space-y-3">
              {["Open link on any phone", "Enter name once — remembered", "Tap to mark packed or returned", "Scan QR codes on gear", "Snap damage photos on the spot"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 max-w-xs mx-auto">
            <div className="text-center space-y-1 mb-4">
              <Package className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold">Pack &amp; Dispatch</p>
              <p className="text-xs text-muted-foreground">Meridian Gala · Jun 12</p>
            </div>
            <div className="space-y-2">
              {["Sony Projector", "JBL Speaker Pair", "Wireless Mic Kit", "Cable Case A", "Folding Chairs × 40"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div><span>{item}</span></div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex justify-between text-xs text-muted-foreground"><span>5 of 5 confirmed</span><span>Packed by Tom</span></div>
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
        <div>
          <div className="rounded-2xl border bg-card p-6 max-w-sm">
            <div className="flex items-center gap-2 mb-4"><Camera className="h-4 w-4 text-amber-600" /><span className="text-sm font-semibold text-amber-700">Report Damage</span></div>
            <p className="text-sm font-medium mb-2">Projection Screen</p>
            <p className="text-xs text-muted-foreground mb-3">Cracked frame. Lower right corner bent.</p>
            <div className="rounded-lg bg-muted h-24 flex items-center justify-center text-xs text-muted-foreground mb-3">📸 Photo evidence attached</div>
            <div className="flex justify-between text-xs"><span>Repair estimate</span><span className="font-medium">$180</span></div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Proof before arguments start.</h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">Damage gets photo evidence and a repair estimate on the spot. The item is blocked until you review it. No more &quot;it was already cracked.&quot;</p>
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
        <h2 className="text-3xl font-bold tracking-tight">Daily owner briefing.</h2>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">Each morning, see what needs attention — overdue returns, missing items, damaged gear, and bookings still waiting to be packed.</p>
        <div className="mt-8 max-w-md mx-auto rounded-xl border bg-card p-4 text-left text-sm space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Today&apos;s briefing</p>
          <p className="text-xs">2 returns due · 1 item missing · 3 damaged blocked · 1 job waiting</p>
          <p className="text-xs text-amber-700 font-medium">Priority: Don&apos;t dispatch the cracked screen. Follow up on missing mic kit.</p>
        </div>
      </div>
    </section>
  )
}

function SetupSection() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader title="Send your spreadsheet. Get a working system." subtitle="We turn your equipment list into a configured workspace in 48 hours — assets, categories, bookings, staff links, damage proof." />
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-center">
        <div className="rounded-xl border p-6"><h3 className="font-semibold">Starter</h3><p className="text-sm text-muted-foreground mt-2">Import assets, categories, QR labels</p></div>
        <div className="rounded-xl border p-6"><h3 className="font-semibold">Workflow</h3><p className="text-sm text-muted-foreground mt-2">Bookings, staff links, return checks, damage proof</p></div>
        <div className="rounded-xl border p-6"><h3 className="font-semibold">Custom</h3><p className="text-sm text-muted-foreground mt-2">Tailored flows, reporting, white-glove setup</p></div>
      </div>
    </section>
  )
}

function FaqSection() {
  const faqs = [
    { q: "Do staff need accounts?", a: "No. They use secure mobile links. Just enter their first name." },
    { q: "Do we need photos of everything?", a: "No. Start with your spreadsheet. Photos for damage only." },
    { q: "Does this handle invoicing?", a: "No. LoadLoop tracks equipment after booking. Invoicing stays in your current tools." },
    { q: "Can we import our spreadsheet?", a: "Yes. CSV/TSV import with auto-mapping and duplicate detection." },
    { q: "Is the daily briefing live?", a: "Coming soon. The current system already tracks everything needed for it." },
  ]

  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <SectionHeader title="Questions?" />
      <div className="space-y-3">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-xl border p-5"><h3 className="font-semibold text-sm">{f.q}</h3><p className="text-sm text-muted-foreground mt-1">{f.a}</p></div>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="border-t bg-foreground text-background">
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Stop tracking equipment from memory.</h2>
        <p className="text-lg text-background/60 mt-4">Your spreadsheet becomes a working system in 48 hours.</p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="#demo" className="inline-flex items-center gap-2 bg-background text-foreground rounded-full px-6 py-3 text-sm font-medium hover:opacity-90"><Play className="h-4 w-4" />Watch demo</Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border border-background/20 hover:bg-background/10">Try it <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  )
}
