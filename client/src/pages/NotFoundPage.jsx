import { Link } from 'react-router-dom'

export default function NotFoundPage({ message = "This page doesn't exist." }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center px-4 py-16 sm:px-6 sm:py-24">
      <section className="max-w-2xl">
        <span className="inline-block -rotate-3 border-2 border-ink bg-tomato px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink uppercase shadow-[3px_3px_0_rgba(21,21,21,.2)]">
          404 · Off the map
        </span>
        <h1 className="display mt-6 text-[clamp(3.5rem,10vw,8rem)]">Wrong turn.</h1>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-muted">{message}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/events" className="btn btn-dark">
            Browse events
          </Link>
          <Link to="/" className="btn btn-outline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
