/**
 * Thin REST API client for the messaging IA admin UI.
 *
 * Talks to the three Plone endpoints registered in
 * backend/src/estades/delta/api/configure.zcml:
 *   - GET  /++api++/@conversations         → list conversations
 *   - GET  /++api++/<path>                 → fetch conversation + children
 *   - POST /++api++/@approve-response      → approve an IA-suggested reply
 *
 * Uses plain fetch() (matches the AggregatorPropertyList pattern) so we
 * don't pull a query client in. Errors are surfaced as thrown Errors with
 * the HTTP status preserved.
 */

export interface ConversationSummary {
  uid: string;
  title: string;
  url: string;
  channel: string;
  review_state: string;
  modified: string | null;
}

export interface ConversationListResponse {
  items: ConversationSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface GuestMessage {
  '@id': string;
  UID: string;
  title: string;
  direction: 'inbound' | 'outbound';
  body: string;
  language_detected?: string;
  classification?: string;
  classification_confidence?: number;
  ia_suggested_response?: string;
  ia_sent?: boolean;
  human_approved_by?: string;
  external_message_id?: string;
  created: string;
}

export interface ConversationDetail {
  '@id': string;
  UID: string;
  title: string;
  channel: string;
  language?: string;
  mode: 'manual' | 'assisted' | 'autonomous';
  last_activity?: string | null;
  review_state: string;
  items: GuestMessage[];
}

export interface ApproveResponseInput {
  message_uid: string;
  approved_text?: string;
}

export interface ApproveResponseResult {
  status: string;
  outbound_uid: string;
  conversation_uid: string;
}

interface ListConversationsOptions {
  limit?: number;
  offset?: number;
  state?: string;
  signal?: AbortSignal;
}

const HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function listConversations(
  options: ListConversationsOptions = {},
): Promise<ConversationListResponse> {
  const qs = new URLSearchParams();
  if (options.limit != null) qs.set('limit', String(options.limit));
  if (options.offset != null) qs.set('offset', String(options.offset));
  if (options.state) qs.set('state', options.state);

  const url = `/++api++/@conversations${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: HEADERS, signal: options.signal });
  return jsonOrThrow<ConversationListResponse>(res);
}

/**
 * Convert an absolute Plone `@id` URL or a Plone path into a /++api++/ URL.
 * Contract:
 *   - Accepts an absolute URL (http://host/Plone/…) or a path (/Plone/…).
 *   - Returns a leading-slash path with /++api++ inserted, e.g.
 *     "/Plone/foo" → "/++api++/Plone/foo".
 *   - Idempotent if /++api++ is already in the input.
 */
export function toApiPath(input: string): string {
  let path = input.replace(/^https?:\/\/[^/]+/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.includes('/++api++/')) return path;
  return `/++api++${path}`;
}

export async function fetchConversation(
  conversationPathOrUrl: string,
  signal?: AbortSignal,
): Promise<ConversationDetail> {
  const apiUrl = toApiPath(conversationPathOrUrl);
  const sep = apiUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${apiUrl}${sep}fullobjects=1`, {
    headers: HEADERS,
    signal,
  });
  return jsonOrThrow<ConversationDetail>(res);
}

export async function approveResponse(
  input: ApproveResponseInput,
): Promise<ApproveResponseResult> {
  const res = await fetch('/++api++/@approve-response', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(input),
  });
  return jsonOrThrow<ApproveResponseResult>(res);
}
