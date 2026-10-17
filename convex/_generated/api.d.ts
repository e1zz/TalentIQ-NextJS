/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assistant from "../assistant.js";
import type * as candidates from "../candidates.js";
import type * as careerSite from "../careerSite.js";
import type * as dashboard from "../dashboard.js";
import type * as documents from "../documents.js";
import type * as employees from "../employees.js";
import type * as inbox from "../inbox.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_documents from "../lib/documents.js";
import type * as lib_domain from "../lib/domain.js";
import type * as lib_events from "../lib/events.js";
import type * as lib_inbox from "../lib/inbox.js";
import type * as lib_jobCards from "../lib/jobCards.js";
import type * as lib_onboarding from "../lib/onboarding.js";
import type * as lib_pipeline from "../lib/pipeline.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_timeOff from "../lib/timeOff.js";
import type * as lib_validators from "../lib/validators.js";
import type * as onboarding from "../onboarding.js";
import type * as referrals from "../referrals.js";
import type * as reports from "../reports.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as timeOff from "../timeOff.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assistant: typeof assistant;
  candidates: typeof candidates;
  careerSite: typeof careerSite;
  dashboard: typeof dashboard;
  documents: typeof documents;
  employees: typeof employees;
  inbox: typeof inbox;
  interviews: typeof interviews;
  jobs: typeof jobs;
  "lib/auth": typeof lib_auth;
  "lib/documents": typeof lib_documents;
  "lib/domain": typeof lib_domain;
  "lib/events": typeof lib_events;
  "lib/inbox": typeof lib_inbox;
  "lib/jobCards": typeof lib_jobCards;
  "lib/onboarding": typeof lib_onboarding;
  "lib/pipeline": typeof lib_pipeline;
  "lib/time": typeof lib_time;
  "lib/timeOff": typeof lib_timeOff;
  "lib/validators": typeof lib_validators;
  onboarding: typeof onboarding;
  referrals: typeof referrals;
  reports: typeof reports;
  search: typeof search;
  seed: typeof seed;
  timeOff: typeof timeOff;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
