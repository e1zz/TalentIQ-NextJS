'use client'

import * as React from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { Briefcase, FileText, User, Users } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { AppShell } from '@/components/app-shell/app-shell'
import { CommandGroup, CommandItem } from '@/components/app-shell/command-dialog'
import type { NavBadges } from '@/components/app-shell/nav-items'

/**
 * AppShell wired to Clerk (user menu, profile) and Convex (badges, search).
 * Queries are skipped until Convex has the Clerk token.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth()
  const { user: clerkUser } = useUser()
  const skip = isAuthenticated ? {} : 'skip'

  // Create the caller's `users` row once Convex sees the session
  const ensureUser = useMutation(api.users.ensureUser)
  React.useEffect(() => {
    if (!isAuthenticated || !clerkUser) return
    void ensureUser({
      name: clerkUser.fullName ?? undefined,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      imageUrl: clerkUser.imageUrl
    })
  }, [isAuthenticated, clerkUser, ensureUser])

  const me = useQuery(api.users.me, skip)
  const inbox = useQuery(api.inbox.list, skip)
  const jobs = useQuery(api.jobs.overview, skip)
  const onboarding = useQuery(api.onboarding.kpis, skip)
  const timeOff = useQuery(api.timeOff.kpis, skip)

  const badges: NavBadges = {
    inbox: inbox?.unread,
    jobs: jobs?.tabs.find(t => t.status === 'Open')?.count,
    onboarding: onboarding?.inProgress,
    'time-off': timeOff?.pendingApprovals
  }

  const name = me?.name ?? clerkUser?.fullName ?? 'TalentIQ user'
  const [query, setQuery] = React.useState('')
  const deferredQuery = React.useDeferredValue(query.trim())

  return (
    <AppShell
      user={{ name, title: me?.title ?? '' }}
      badges={badges}
      hasUnreadNotifications={(inbox?.unread ?? 0) > 0}
      userMenu={<UserButton />}
      onSearchQueryChange={setQuery}
      searchResults={isAuthenticated ? <SearchResults q={deferredQuery} /> : null}
    >
      {children}
    </AppShell>
  )
}

function SearchResults({ q }: { q: string }) {
  const results = useQuery(api.search.global, q ? { q } : 'skip')
  if (!q || !results) return null
  const empty = results.people.length + results.jobs.length + results.documents.length === 0
  if (empty) {
    return <p className='px-3 py-6 text-center text-body text-muted-foreground'>No results for “{q}”</p>
  }
  return (
    <>
      {results.people.length > 0 ? (
        <CommandGroup heading='People'>
          {results.people.map(p => (
            <CommandItem
              key={p._id}
              href={p.kind === 'candidate' ? `/dashboard/candidates/${p._id}` : `/dashboard/employees?id=${p._id}`}
              icon={p.kind === 'candidate' ? <Users /> : <User />}
              label={p.name}
              meta={p.subtitle}
            />
          ))}
        </CommandGroup>
      ) : null}
      {results.jobs.length > 0 ? (
        <CommandGroup heading='Jobs'>
          {results.jobs.map(j => (
            <CommandItem key={j._id} href={`/dashboard/jobs/${j._id}`} icon={<Briefcase />} label={j.title} meta={j.subtitle} />
          ))}
        </CommandGroup>
      ) : null}
      {results.documents.length > 0 ? (
        <CommandGroup heading='Documents'>
          {results.documents.map(d => (
            <CommandItem
              key={d._id}
              href={`/dashboard/documents?id=${d._id}`}
              icon={<FileText />}
              label={d.title}
              meta={d.folder}
            />
          ))}
        </CommandGroup>
      ) : null}
    </>
  )
}
