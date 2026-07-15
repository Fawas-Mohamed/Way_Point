import Link from "next/link";
import {
  ArrowRight,
  KanbanSquare,
  GitBranch,
  Users,
  BarChart3,
  Bell,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Boards that don't fight you",
    description: "Drag tasks across a Kanban board, a list, or a calendar — the same data, three honest views of it.",
  },
  {
    icon: GitBranch,
    title: "Dependencies that actually block",
    description: "Mark one task as blocking another and Waypoint won't let it slip to Done until its blockers clear.",
  },
  {
    icon: Users,
    title: "Roles that mean something",
    description: "Administrators, project managers, and team members each see exactly the controls their role needs — nothing more.",
  },
  {
    icon: BarChart3,
    title: "Reports without the spreadsheet",
    description: "Completion rate, overdue counts, and per-project workload, computed live — export to PDF or CSV when you need to share it.",
  },
  {
    icon: Bell,
    title: "Notified, not spammed",
    description: "Choose what reaches your inbox versus what stays in-app. Assignments, due dates, and mentions — your call.",
  },
  {
    icon: Shield,
    title: "An audit trail that holds up",
    description: "Every status change, archive, and permission grant is logged with who and when — visible to admins, always.",
  },
];

const WORKFLOW_STEPS = [
  { title: "Map the project", description: "Set milestones as waypoints on the route — the shape of the work, visible from day one." },
  { title: "Assign the work", description: "Break milestones into tasks, assign them, set priority and dependencies." },
  { title: "Track the route", description: "Watch the route line fill in as work moves from To Do through Done — no separate status meeting required." },
  { title: "Ship and review", description: "Close the loop with a report: on-time rate, workload balance, what to change next sprint." },
];

const TESTIMONIALS = [
  {
    quote: "We replaced three tools with Waypoint in a week. The dependency blocking alone saved us from two shipped bugs.",
    name: "Priya Sharma",
    role: "Senior Project Manager, Fintech startup",
  },
  {
    quote: "The route view finally made our roadmap make sense to people outside engineering.",
    name: "Jonas Berg",
    role: "Frontend Engineer",
  },
  {
    quote: "Permission management that doesn't need a wiki page to explain. That's rarer than it should be.",
    name: "Amara Okafor",
    role: "Head of Operations",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For small teams finding their footing.",
    features: ["Up to 3 projects", "10 team members", "Kanban, list & calendar views", "Basic reports"],
  },
  {
    name: "Team",
    price: "$14",
    period: "per member / month",
    description: "For teams shipping on a schedule.",
    features: ["Unlimited projects", "Unlimited members", "Dependencies & milestones", "Full analytics & exports", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with real compliance needs.",
    features: ["Everything in Team", "SSO & SCIM provisioning", "Custom roles & permissions", "Dedicated onboarding"],
  },
];

const FAQS = [
  {
    q: "Is this a real, hosted product?",
    a: "This build is a portfolio project demonstrating a full-stack project management platform — pricing and sign-up are illustrative.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes — the repository ships with a Docker Compose file covering Postgres, the API, and the web app.",
  },
  {
    q: "What's the difference between a Project Manager and Administrator role?",
    a: "Project Managers can create and run projects and manage their own teams. Administrators additionally manage users, roles, and platform-wide settings.",
  },
  {
    q: "Does it support file attachments?",
    a: "Tasks and projects both support file uploads, with a dedicated file manager for browsing everything a project has collected.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-cloud">
      <Nav />
      <Hero />
      <Features />
      <Workflow />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-cloud/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="4" cy="18" r="2.5" fill="#0F9D6E" />
            <circle cx="11" cy="10" r="2.5" fill="#0F9D6E" />
            <circle cx="18" cy="4" r="3" fill="#3730A5" />
            <path d="M6 16.5L9.5 12M13 8.5L16 5.5" stroke="#0F9D6E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[19px] font-medium text-ink">Waypoint</span>
        </Link>
        <nav className="hidden items-center gap-8 text-caption font-medium text-slate-mid md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#workflow" className="hover:text-ink">How it works</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <a href="#faq" className="hover:text-ink">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-caption font-semibold text-ink hover:text-indigo-deep">
            Sign in
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60"
        style={{ background: "radial-gradient(900px 480px at 50% -10%, rgba(55,48,165,0.10), transparent)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center lg:pt-28">
        <p className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 py-1 text-[12px] font-semibold text-slate-mid">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-route" /> Now with dependency-aware Kanban
        </p>
        <h1 className="font-display text-[44px] font-medium leading-[1.08] text-ink sm:text-[56px] sm:leading-[1.05]">
          Every project has a route.
          <br />
          <span className="text-indigo-deep">Waypoint makes it visible.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-body text-slate-mid">
          Plan milestones, assign work, and watch progress fill in like a path instead of a percentage.
          Built for teams who are tired of dashboards that look busy but say nothing.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">
              Start for free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#workflow">
            <Button size="lg" variant="secondary">
              See how it works
            </Button>
          </a>
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-lg border border-hairline bg-paper p-3 shadow-lifted">
          <div className="rounded-md border border-hairline bg-cloud p-6 text-left">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-amber-signal">Due in 2 days</p>
                <p className="font-display text-h3 text-ink">Finalize the client onboarding flow</p>
              </div>
              <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[12px] font-semibold text-amber-signal">high</span>
            </div>
            <svg viewBox="0 0 600 32" className="w-full">
              <line x1={16} y1={16} x2={230} y2={16} stroke="#0F9D6E" strokeWidth={3} strokeLinecap="round" />
              <line x1={230} y1={16} x2={584} y2={16} stroke="#E4E7EC" strokeWidth={3} strokeLinecap="round" strokeDasharray="1 10" />
              <circle cx={16} cy={16} r={6} fill="#0F9D6E" />
              <circle cx={120} cy={16} r={6} fill="#0F9D6E" />
              <circle cx={230} cy={16} r={9} fill="#0F9D6E" />
              <circle cx={230} cy={16} r={14} fill="none" stroke="#0F9D6E" strokeOpacity={0.25} strokeWidth={4} />
              <circle cx={400} cy={16} r={6} fill="#FFFFFF" stroke="#E4E7EC" strokeWidth={2} />
              <circle cx={584} cy={16} r={6} fill="#FFFFFF" stroke="#E4E7EC" strokeWidth={2} />
            </svg>
            <p className="mt-2 text-[12px] text-slate-mid">2 of 5 waypoints complete</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-xl">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">Features</p>
        <h2 className="font-display text-h1 text-ink">Everything a project needs, nothing it doesn&apos;t.</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-md border border-hairline bg-paper p-6 shadow-soft transition-shadow hover:shadow-lifted">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-soft">
              <feature.icon className="h-4.5 w-4.5 text-indigo-deep" />
            </div>
            <h3 className="text-h3 text-ink">{feature.title}</h3>
            <p className="mt-2 text-body text-slate-mid">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="bg-ink-slate py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 max-w-xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-emerald-route">How it works</p>
          <h2 className="font-display text-h1 text-white">Four waypoints, one route.</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-route font-mono text-[13px] font-semibold text-emerald-route">
                  {i + 1}
                </span>
                {i < WORKFLOW_STEPS.length - 1 && <span className="hidden h-px flex-1 bg-white/15 md:block" />}
              </div>
              <h3 className="text-h3 text-white">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-xl">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">What teams say</p>
        <h2 className="font-display text-h1 text-ink">Trusted by teams who ship on a deadline.</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="flex flex-col justify-between rounded-md border border-hairline bg-paper p-6 shadow-soft">
            <blockquote className="font-display text-[18px] leading-[27px] text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-6 text-caption">
              <span className="font-semibold text-ink">{t.name}</span>
              <span className="block text-slate-mid">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-paper py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 max-w-xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">Pricing</p>
          <h2 className="font-display text-h1 text-ink">Simple pricing, no surprises.</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-md border p-6 ${tier.highlighted ? "border-indigo-deep bg-indigo-soft/40 shadow-lifted" : "border-hairline bg-paper shadow-soft"}`}
            >
              <h3 className="text-h3 text-ink">{tier.name}</h3>
              <p className="mt-1 text-[13px] text-slate-mid">{tier.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-[32px] text-ink">{tier.price}</span>
                {tier.period && <span className="text-[13px] text-slate-mid">/ {tier.period}</span>}
              </div>
              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-route" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-6 block">
                <Button variant={tier.highlighted ? "primary" : "secondary"} className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-indigo-deep">FAQ</p>
        <h2 className="font-display text-h1 text-ink">Questions, answered plainly.</h2>
      </div>
      <div className="divide-y divide-hairline rounded-md border border-hairline bg-paper">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink marker:content-none">
              {item.q}
            </summary>
            <p className="mt-2.5 text-body text-slate-mid">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-hairline bg-cloud">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="4" cy="18" r="2.5" fill="#0F9D6E" />
                <circle cx="11" cy="10" r="2.5" fill="#0F9D6E" />
                <circle cx="18" cy="4" r="3" fill="#3730A5" />
              </svg>
              <span className="font-display text-[16px] font-medium text-ink">Waypoint</span>
            </div>
            <p className="mt-2 max-w-xs text-[13px] text-slate-mid">
              A project & task management platform built as a full-stack portfolio project.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-[13px] sm:grid-cols-3">
            <div>
              <p className="mb-3 font-semibold text-ink">Product</p>
              <ul className="space-y-2 text-slate-mid">
                <li><a href="#features" className="hover:text-ink">Features</a></li>
                <li><a href="#pricing" className="hover:text-ink">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-ink">Account</p>
              <ul className="space-y-2 text-slate-mid">
                <li><Link href="/login" className="hover:text-ink">Sign in</Link></li>
                <li><Link href="/register" className="hover:text-ink">Create account</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-[12px] text-slate-mid">© {new Date().getFullYear()} Waypoint. Built as a portfolio project.</p>
      </div>
    </footer>
  );
}
