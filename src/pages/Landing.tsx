import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Building2, Users, CreditCard, BarChart3, Shield, Globe,
  MessageSquare, FileText, Bell, Smartphone, ArrowRight, CheckCircle2, Home
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const features = [
  { icon: CreditCard, title: "M-Pesa & Bank Payments", desc: "Integrated Daraja STK Push, Equity, KCB, and Co-op Bank payments with automatic reconciliation." },
  { icon: Users, title: "Tenant Management", desc: "Digital records, lease tracking, document storage, and a self-service tenant portal." },
  { icon: BarChart3, title: "Financial Analytics", desc: "Real-time dashboards with occupancy trends, arrears aging, and collection rate analytics." },
  { icon: Bell, title: "Automated Reminders", desc: "SMS rent reminders, lease renewal alerts, and bulk messaging via Africa's Talking." },
  { icon: FileText, title: "Invoicing & Receipts", desc: "Paperless PDF invoicing with automatic delivery via email and SMS on payment." },
  { icon: MessageSquare, title: "In-App Messaging", desc: "Threaded landlord-tenant communication with full audit trail and search." },
  { icon: Shield, title: "Role-Based Access", desc: "Super Admin, Landlord, Manager, Accountant, Viewer, and Tenant roles with granular permissions." },
  { icon: Globe, title: "Multi-Market Ready", desc: "Pluggable payment and currency layers for Kenya, Uganda, Tanzania, Ghana, and Nigeria." },
];

const stats = [
  { value: "10K+", label: "Properties Managed" },
  { value: "50K+", label: "Tenants Served" },
  { value: "KES 2B+", label: "Payments Processed" },
  { value: "99.9%", label: "Uptime" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">NyumbaHub</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button variant="hero" size="sm">Start Free Trial</Button></Link>
          </div>
          <Link to="/signup" className="md:hidden">
            <Button variant="hero" size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(152,55%,36%,0.15),transparent_50%)]" />
        <div className="container relative z-10 flex min-h-[85vh] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6"
          >
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Built for East Africa's Property Market
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "hsl(0, 0%, 100%)" }}
          >
            Property Management,{" "}
            <span className="gradient-text">Simplified</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg"
            style={{ color: "hsl(210, 15%, 75%)" }}
          >
            Collect rent via M-Pesa, manage tenants, automate invoicing, and track finances — all from one platform designed for African landlords and property managers.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link to="/signup">
              <Button variant="hero" size="lg" className="gap-2 h-12 px-8 text-base">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="hero-outline" size="lg" className="h-12 px-8 text-base border-primary-foreground/20 text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground">
                View Demo Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-heading text-2xl font-bold" style={{ color: "hsl(152, 55%, 55%)" }}>{s.value}</div>
                <div className="mt-1 text-xs" style={{ color: "hsl(210, 15%, 60%)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Manage Properties
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From M-Pesa payments to tenant portals, NyumbaHub covers every aspect of property management in East Africa.
            </p>
          </motion.div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="stat-card group cursor-default"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free, scale as you grow. No hidden fees.</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
            {[
              { name: "Starter", price: "Free", units: "Up to 10 units", features: ["M-Pesa payments", "Tenant records", "SMS reminders", "Basic reports"] },
              { name: "Professional", price: "KES 2,500/mo", units: "Up to 100 units", features: ["All Starter features", "Multi-currency support", "Financial analytics", "Tenant portal", "API access"], popular: true },
              { name: "Enterprise", price: "Custom", units: "Unlimited units", features: ["All Professional features", "Multi-market support", "Dedicated support", "Custom integrations", "SLA guarantee"] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${plan.popular ? "border-primary bg-card shadow-xl ring-1 ring-primary/20" : "bg-card"}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-card-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="font-heading text-3xl font-extrabold text-card-foreground">{plan.price}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.units}</p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-card-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className="mt-8 w-full"
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">NyumbaHub</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 NyumbaHub. Built for Africa.</p>
        </div>
      </footer>
    </div>
  );
}
