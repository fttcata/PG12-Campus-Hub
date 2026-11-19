import { UNIVERSITIES } from '../utils/universities.js'

// Two-column layout for login/register: pitch + allowed domains on the left, form on the right.
export default function AuthLayout({ eyebrow, title, children }) {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
      <section className="on-ink relative flex flex-col justify-between overflow-hidden border-2 border-ink bg-ink p-8 text-cream shadow-[8px_8px_0_rgba(21,21,21,.18)] md:p-10">
        <div className="relative">
          <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-tomato uppercase">{eyebrow}</p>
          <h1 className="display mt-5 text-5xl md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-sm leading-relaxed text-cream/70">
            Campus Hub is for verified Hong Kong university students. Anyone can browse; booking, pledging and
            organising need a student account.
          </p>
        </div>
        <ul className="relative mt-10 space-y-3 font-mono text-xs">
          {UNIVERSITIES.map((university) => (
            <li key={university.code} className="flex flex-wrap justify-between gap-2 border-t border-cream/15 pt-3">
              <span className="tracking-[0.08em] text-cream uppercase">{university.code}</span>
              <span className="text-cream/50">@{university.domains[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center">
        <div className="w-full max-w-md border-2 border-ink bg-card p-6 shadow-[6px_6px_0_rgba(21,21,21,.16)] sm:p-8">
          {children}
        </div>
      </section>
    </main>
  )
}
