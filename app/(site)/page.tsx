import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  ChartColumnIncreasing,
  Check,
  FileText,
  Quote,
  Sparkles,
  Users
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { HrButton, StatusPill, Tag } from '@/components/hr'
import { ProductPreview } from '@/components/landing/product-preview'
import { Reveal } from '@/components/landing/reveal'

const AREAS = [
  {
    id: 'hiring',
    icon: Briefcase,
    tone: 'bg-brand-soft text-brand-fg',
    title: 'Hiring',
    description: 'Every open role, candidate and interview in one pipeline, with health flags before a role slips.',
    screens: ['Jobs with on-track, slow and overdue health', 'Kanban pipeline and candidate profiles', 'Interview calendar and scorecards', 'Referrals and your career site']
  },
  {
    id: 'people',
    icon: Users,
    tone: 'bg-teal-soft text-teal-foreground',
    title: 'People',
    description: 'From signed offer to day one and beyond, without chasing spreadsheets or inboxes.',
    screens: ['Employee directory and profiles', 'Onboarding checklists by team', 'Time-off requests and balances', 'Documents and e-signatures']
  },
  {
    id: 'insights',
    icon: ChartColumnIncreasing,
    tone: 'bg-violet-soft text-violet-foreground',
    title: 'Insights',
    description: 'The numbers leadership asks for, already up to date when they ask.',
    screens: ['Time to hire and offer acceptance', 'Hires by source and funnel conversion', 'Headcount by department', 'Cost per hire and turnover']
  }
]

const STEPS = [
  {
    title: 'Start with what needs you',
    body: 'Home opens on today: new applications, overdue feedback, offers and time off waiting for approval.'
  },
  {
    title: 'Act without switching tools',
    body: 'Approve an offer, move a candidate or send a contract from the same inbox, with the context beside it.'
  },
  {
    title: 'See the full picture',
    body: 'When the urgent work is done, reports and the AI assistant show where hiring and the team are heading.'
  }
]

/** Soft blurred circles behind the hero, placed like the Figma Cover glows. */
function HeroGlows() {
  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
      <div className='absolute -top-64 right-[-12rem] size-[56rem] rounded-full bg-hero-glow opacity-70 blur-[140px]' />
      <div className='absolute -bottom-72 right-[-6rem] size-[40rem] rounded-full bg-hero-glow opacity-50 blur-[140px]' />
    </div>
  )
}

export default function Home() {
  return (
    <>
      {/* Hero: the Figma Cover title block next to the product */}
      <section aria-labelledby='hero-title' className='relative isolate overflow-hidden bg-hero text-white'>
        <HeroGlows />
        <div className='relative mx-auto grid max-w-7xl gap-12 px-4 pt-16 pb-20 md:px-8 md:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:pb-28'>
          <Reveal className='flex flex-col items-start gap-6 md:gap-7'>
            <p className='text-sm font-semibold tracking-[0.08em] text-hero-muted uppercase md:text-lg'>
              HR platform · Hiring to people ops
            </p>
            <h1
              id='hero-title'
              className='text-5xl leading-[1.05] font-bold tracking-[-0.02em] text-balance sm:text-6xl xl:text-[88px]'
            >
              The HR Specialist workspace
            </h1>
            <p className='max-w-xl text-lg text-pretty text-hero-muted md:text-2xl md:leading-[1.3]'>
              A calmer, task-first HR platform: what needs you today first, then the full picture.
            </p>
            <div className='flex flex-wrap gap-3 pt-1'>
              <Link
                href='/sign-up'
                className='hit-target group inline-flex h-12 items-center gap-2 rounded-sm bg-white px-5 text-base font-semibold text-brand-700 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              >
                Get started
                <ArrowRight aria-hidden='true' className='size-[18px] transition-transform group-hover:translate-x-0.5' strokeWidth={1.75} />
              </Link>
              <Link
                href='/sign-in'
                className='hit-target inline-flex h-12 items-center rounded-sm border border-white/30 bg-white/10 px-5 text-base font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
              >
                Sign in
              </Link>
            </div>
            <ul aria-label='Included' className='flex flex-wrap gap-2.5 pt-2'>
              {['Hiring', 'People', 'Insights', 'AI assistant'].map(chip => (
                <li
                  key={chip}
                  className='rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white md:text-base'
                >
                  {chip}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Desktop: tilted and bleeding off the edge like the Cover. Smaller screens: cropped window. */}
          <Reveal delay={0.15} className='relative h-[420px] overflow-hidden rounded-xl sm:h-[520px] lg:h-[620px] lg:overflow-visible lg:rounded-none'>
            <ProductPreview className='lg:absolute lg:top-1/2 lg:left-0 lg:[transform:translateY(-50%)_perspective(2400px)_rotateY(-14deg)_rotateX(4deg)]' />
          </Reveal>
        </div>
      </section>

      {/* Product areas */}
      <section id='product' aria-labelledby='product-title' className='scroll-mt-16 bg-background py-20 md:py-28'>
        <div className='mx-auto max-w-7xl px-4 md:px-8'>
          <Reveal className='max-w-2xl'>
            <p className='text-meta font-semibold tracking-overline text-brand-fg uppercase'>One workspace</p>
            <h2 id='product-title' className='mt-3 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl'>
              Hiring, people and insights, without the tab juggling
            </h2>
            <p className='mt-4 text-lg text-fg-secondary text-pretty'>
              Fourteen screens share one design system, one search and one inbox, so a candidate becomes an
              employee without being copied between tools.
            </p>
          </Reveal>

          <div className='mt-12 grid gap-5 md:grid-cols-3'>
            {AREAS.map((area, i) => (
              <Reveal key={area.id} delay={i * 0.08} className='h-full'>
                <article className='flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-xs'>
                  <span className={cn('inline-flex size-11 items-center justify-center rounded-md', area.tone)}>
                    <area.icon aria-hidden='true' className='size-[22px]' strokeWidth={1.75} />
                  </span>
                  <h3 className='mt-5 text-xl font-bold text-foreground'>{area.title}</h3>
                  <p className='mt-2 text-body text-fg-secondary'>{area.description}</p>
                  <ul className='mt-5 flex flex-col gap-2.5 border-t border-border-subtle pt-5'>
                    {area.screens.map(screen => (
                      <li key={screen} className='flex items-start gap-2.5 text-body text-fg-body'>
                        <Check aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-success' strokeWidth={2} />
                        {screen}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI assistant */}
      <section id='assistant' aria-labelledby='assistant-title' className='scroll-mt-16 border-y border-border bg-subtle py-20 md:py-28'>
        <div className='mx-auto grid max-w-7xl items-center gap-12 px-4 md:px-8 lg:grid-cols-2 lg:gap-16'>
          <Reveal>
            <p className='text-meta font-semibold tracking-overline text-brand-fg uppercase'>AI assistant</p>
            <h2 id='assistant-title' className='mt-3 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl'>
              Screening help that shows its work
            </h2>
            <p className='mt-4 text-lg text-fg-secondary text-pretty'>
              Upload CVs and a job description, then ask. Answers cite the exact CV pages they come from, so you can
              check every claim before it shapes a decision.
            </p>
            <ul className='mt-8 flex flex-col gap-4'>
              {[
                ['Cited answers', 'Every summary links back to the page in the CV it is based on.'],
                ['Merit-based by design', 'Screening rules focus on skills and experience, not names, photos or gaps.'],
                ['Your documents stay yours', 'Files are only used to answer your questions in your workspace.']
              ].map(([title, body]) => (
                <li key={title} className='flex gap-3'>
                  <span className='mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-fg'>
                    <Check aria-hidden='true' className='size-3.5' strokeWidth={2.5} />
                  </span>
                  <span>
                    <span className='block text-body font-semibold text-foreground'>{title}</span>
                    <span className='block text-body text-fg-secondary'>{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Illustrative conversation */}
          <Reveal delay={0.1}>
            <figure className='rounded-xl border border-border bg-card p-5 shadow-overlay md:p-6'>
              <figcaption className='flex items-center gap-2 border-b border-border-subtle pb-4 text-body font-semibold text-foreground'>
                <span className='inline-flex size-8 items-center justify-center rounded-sm bg-brand-soft text-brand-fg'>
                  <Sparkles aria-hidden='true' className='size-[18px]' strokeWidth={1.75} />
                </span>
                AI assistant
                <StatusPill tone='success' className='ml-auto'>3 CVs loaded</StatusPill>
              </figcaption>
              <div className='flex flex-col gap-4 pt-5'>
                <p className='ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-4 py-3 text-body text-primary-foreground'>
                  Who has led a design system migration, and how big was the team?
                </p>
                <div className='max-w-[92%] rounded-lg rounded-bl-sm border border-border bg-subtle px-4 py-3 text-body text-fg-body'>
                  <p>
                    <strong className='font-semibold text-foreground'>Tomás Álvarez</strong> led the move from three
                    component libraries to one, with a team of 6 designers and 4 engineers.
                  </p>
                  <blockquote className='mt-3 flex gap-2 border-l-2 border-brand-300 pl-3 text-meta text-fg-secondary'>
                    <Quote aria-hidden='true' className='mt-0.5 size-3.5 shrink-0 text-icon' strokeWidth={1.75} />
                    “Led consolidation of 3 UI libraries into a single design system (6 designers, 4 engineers).”
                  </blockquote>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    <Tag tone='brand' icon={<FileText />}>CV · Tomás Álvarez · p. 1</Tag>
                  </div>
                </div>
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id='how-it-works' aria-labelledby='how-title' className='scroll-mt-16 bg-background py-20 md:py-28'>
        <div className='mx-auto max-w-7xl px-4 md:px-8'>
          <Reveal className='max-w-2xl'>
            <p className='text-meta font-semibold tracking-overline text-brand-fg uppercase'>How it works</p>
            <h2 id='how-title' className='mt-3 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl'>
              Today first, then the full picture
            </h2>
          </Reveal>
          <ol className='mt-12 grid gap-5 md:grid-cols-3'>
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 0.08} className='flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-6'>
                  <span className='inline-flex size-9 items-center justify-center rounded-full bg-brand-600 text-body font-bold text-white tabular-nums'>
                    {i + 1}
                  </span>
                  <h3 className='text-card-title font-bold text-foreground'>{step.title}</h3>
                  <p className='text-body text-fg-secondary'>{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby='cta-title' className='relative isolate overflow-hidden bg-hero py-20 text-white md:py-24'>
        <HeroGlows />
        <Reveal className='relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center'>
          <h2 id='cta-title' className='text-3xl font-bold tracking-tight text-balance md:text-5xl'>
            Start your day with what needs you
          </h2>
          <p className='max-w-xl text-lg text-hero-muted'>
            Create a workspace in minutes. Bring your open roles and team, and TalentIQ lines up the rest.
          </p>
          <HrButton asChild size='md' className='h-12 border-0 bg-white px-6 text-base text-brand-700 hover:bg-blue-50 hover:text-brand-700'>
            <Link href='/sign-up'>
              Get started
              <ArrowRight aria-hidden='true' />
            </Link>
          </HrButton>
        </Reveal>
      </section>
    </>
  )
}
