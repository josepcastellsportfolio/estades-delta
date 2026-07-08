/**
 * Assistant UI engine — shared types.
 *
 * The frontier between a frontend and the assistant service. A frontend never
 * calls a model directly: it talks to an `AssistantClient`, sending (a) the
 * available action definitions as tools, (b) a snapshot of what the user sees,
 * and (c) the message. The same interface backs every implementation (a Plone
 * proxy, a direct microservice call, a mock) so swapping is a one-line change.
 *
 * Framework-agnostic: no React, no Tailwind, no Volto. Ported and generalized
 * from the original stellify intelUI engine — the stellify-specific entity
 * taxonomy is now an open `string` so each host defines its own.
 */
type ChatRole = 'user' | 'assistant';
interface ChatMessage {
    id: string;
    role: ChatRole;
    text: string;
    /** ISO timestamp; useful for ordering and display. */
    createdAt: string;
    /** True while a reply is in flight (assistant placeholder → "thinking"). */
    pending?: boolean;
    /** Citations backing an assistant answer (RAG). Empty for user messages. */
    sources?: Citation[];
}
/** A source the assistant relied on, for a clickable citation in the UI. */
interface Citation {
    /** Canonical URL of the source (clickable). */
    url: string;
    /** Human-readable title of the source page. */
    title?: string;
    /** Stable id of the source object (e.g. a content UID). */
    sourceUid?: string;
    /** Similarity score in [0, 1], if the host wants to show/sort by it. */
    score?: number;
}
interface ConversationSummary {
    id: string;
    title: string;
    /** ISO timestamp of the last activity. */
    updatedAt: string;
}
interface Conversation extends ConversationSummary {
    messages: ChatMessage[];
}
/**
 * The kind of a selectable domain entity. Host-defined — a planner uses
 * "evento"/"tarea", a CMS might use "page"/"property". Open string, not a
 * fixed union, so the engine stays domain-neutral.
 */
type EntityType = string;
/**
 * A selectable domain entity the assistant can act on. `actionIds` links the
 * entity to the registry actions that apply to it.
 */
interface AssistantEntity {
    type: EntityType;
    id: string;
    /** Human-readable name → chat chip + resolution of "this / move it". */
    label: string;
    /** Recurring targets: mutations must disambiguate instance vs series. */
    recurring?: boolean;
    actionIds: string[];
}
/** The current selection, written to the snapshot on click (single-selection). */
interface AssistantSelection {
    type: EntityType;
    id: string;
    label: string;
    recurring?: boolean;
}
/** Snapshot of the visible page state sent with each turn (a summary). */
interface AssistantSnapshot {
    /** The entity the user has selected, if any. */
    selection: AssistantSelection | null;
}
/** JSON-Schema-ish parameter description that travels to the assistant. */
interface ActionParameters {
    type: 'object';
    properties: Record<string, {
        type: string;
        description?: string;
    }>;
    required?: string[];
}
/** Serializable part of an action — sent to the assistant as a tool. */
interface ActionDefinition {
    id: string;
    description: string;
    /** "global" or a route the action is scoped to (e.g. "/admin/planner"). */
    scope: 'global' | string;
    parameters: ActionParameters;
    examples?: string[];
    /** When true, the UI confirms before running. */
    confirm?: boolean;
}
interface ActionResult {
    ok: boolean;
    summary: string;
    data?: unknown;
}
/** Context passed to a handler at execution time (current route + snapshot). */
interface ActionContext {
    route: string;
    snapshot: AssistantSnapshot | null;
}
type ActionHandler = (params: Record<string, unknown>, ctx: ActionContext) => ActionResult | Promise<ActionResult>;
/** Definition (serializable, travels) + handler (stays in the browser). */
interface RegisteredAction {
    definition: ActionDefinition;
    handler: ActionHandler;
}
/** Snapshot of the visible page state (a summary, NOT the full DOM). */
interface PageContext {
    route: string;
    snapshot: AssistantSnapshot | null;
}
/** One turn the frontend sends to the assistant. */
interface AssistantTurn {
    message: string;
    /** Serializable action definitions visible in the current scope. */
    tools: ActionDefinition[];
    /** Snapshot of what the user currently sees. */
    pageContext: PageContext;
}
/** What the assistant returns: maybe a tool call, and/or final text + sources. */
interface AssistantResponse {
    toolCall?: {
        id: string;
        name: string;
        input: Record<string, unknown>;
    };
    text?: string;
    /** Citations backing `text` (RAG). */
    sources?: Citation[];
}
/**
 * The frontier. Implemented by a Plone-proxy client (Volto), a direct
 * microservice client, or a mock. Same interface, same contract.
 *
 * `send` carries the conversation via the client's own session handling
 * (a stateful service threads a session id internally); `history` is passed
 * for clients that replay it, and ignored by session-stateful ones.
 */
interface AssistantClient {
    send(turn: AssistantTurn, history: AssistantResponse[], signal?: AbortSignal): Promise<AssistantResponse>;
    listConversations(): Promise<ConversationSummary[]>;
}

/**
 * Action registry.
 *
 * Pages register the actions the assistant may perform when they mount and
 * clean them up on unmount. The `definition` is serializable and travels to
 * the assistant as a tool; the `handler` stays in the browser and operates on
 * the real page state.
 *
 * Ships EMPTY — a host with no page actions gets pure Q&A. Extension point:
 *   const unregister = registry.register(myAction)
 *   // ...later, on cleanup:
 *   unregister()
 */

declare class ActionRegistry {
    private actions;
    /** Register an action; returns an unregister function. */
    register(action: RegisteredAction): () => void;
    unregister(id: string): void;
    /** Serializable tool definitions visible in a scope ("global" always shown). */
    getToolDefinitions(scope: string): ActionDefinition[];
    /** True when an action with this id is registered (drives the highlight). */
    has(id: string): boolean;
    list(): RegisteredAction[];
    /** Execute a registered action's handler. */
    execute(id: string, params: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult>;
}

/**
 * The 2-turn conversation loop.
 *
 * 1. Build the turn (message + visible tool definitions + page snapshot) and
 *    send it to the assistant.
 * 2. If the assistant asks to run a tool, execute it REALLY via the registry
 *    (this changes real page state), then send the result back so the
 *    assistant can produce its final natural-language text.
 * 3. Return the final text (and any citations) to display.
 *
 * With an empty registry (or a service that returns text-only), the tool
 * branch is inert and this collapses to a single Q&A turn — so the same loop
 * serves both pure Q&A and, once the service emits tool calls, real actions.
 */

interface RunTurnArgs {
    client: AssistantClient;
    registry: ActionRegistry;
    message: string;
    pageContext: PageContext;
    /** Abort the in-flight assistant request (cancel button). */
    signal?: AbortSignal;
}
interface RunTurnResult {
    text: string;
    /** Citations backing `text` (RAG), if any. */
    sources?: Citation[];
    /** Summary of an executed action, if any (drives a system line in the UI). */
    actionSummary?: string;
}
declare function runConversationTurn(args: RunTurnArgs): Promise<RunTurnResult>;

/**
 * HTTP implementation of `AssistantClient` against the real assistant service
 * contract (ADR-024). Replaces the original stub, which targeted an imagined
 * `/assistant/chat` with a `{turn, history}` body — the real service is
 * `POST <chatPath>` with `{query, session_id?}` and is session-stateful.
 *
 * One client, two deployments (the shared-engine goal):
 *   - Volto: point `chatPath` at the Plone proxy ('/++api++/@assistant-chat'),
 *     with `credentials: 'same-origin'` so the browser's Plone auth cookie
 *     rides along — no token handling in JS.
 *   - Direct: point `chatPath` at the service ('/api/v1/assistant/chat/') and
 *     supply an Authorization header via `headers`.
 *
 * The service threads the conversation by `session_id`, so this client keeps
 * the id from the first response and sends it on subsequent turns; it does NOT
 * replay `history` (that parameter is accepted for interface compatibility and
 * ignored).
 */

interface HttpAssistantClientOptions {
    /** URL/path of the chat endpoint (proxy or direct service). */
    chatPath: string;
    /** Optional path listing conversations; omit if the host doesn't expose it. */
    conversationsPath?: string;
    /**
     * Injected fetch. Defaults to global `fetch`. Injectable so tests and
     * non-browser hosts can supply their own.
     */
    fetchFn?: typeof fetch;
    /** Extra headers (e.g. Authorization for the direct/JWT deployment). */
    headers?: Record<string, string>;
    /**
     * Credentials mode. Use 'same-origin' for the Volto proxy so the auth cookie
     * is sent; 'omit' (default) for a token-based direct call.
     */
    credentials?: RequestCredentials;
}
declare class HttpAssistantClient implements AssistantClient {
    private readonly opts;
    private readonly fetchFn;
    private sessionId;
    constructor(options: HttpAssistantClientOptions);
    /** Reset the conversation (start a fresh session on the next send). */
    resetSession(): void;
    send(turn: AssistantTurn, _history: AssistantResponse[], signal?: AbortSignal): Promise<AssistantResponse>;
    listConversations(): Promise<ConversationSummary[]>;
}

/**
 * A trivial, host-neutral mock client for tests and offline dev.
 *
 * Echoes a canned reply and never returns a tool call, so the conversation
 * loop exercises the pure-Q&A path. Configure the reply/citations per instance.
 */

interface MockAssistantClientOptions {
    /** Fixed reply text, or a function of the user's message. */
    reply?: string | ((message: string) => string);
    sources?: Citation[];
    conversations?: ConversationSummary[];
}
declare class MockAssistantClient implements AssistantClient {
    private readonly opts;
    constructor(opts?: MockAssistantClientOptions);
    send(turn: AssistantTurn, _history: AssistantResponse[], _signal?: AbortSignal): Promise<AssistantResponse>;
    listConversations(): Promise<ConversationSummary[]>;
}

export { type ActionContext, type ActionDefinition, type ActionHandler, type ActionParameters, ActionRegistry, type ActionResult, type AssistantClient, type AssistantEntity, type AssistantResponse, type AssistantSelection, type AssistantSnapshot, type AssistantTurn, type ChatMessage, type ChatRole, type Citation, type Conversation, type ConversationSummary, type EntityType, HttpAssistantClient, type HttpAssistantClientOptions, MockAssistantClient, type MockAssistantClientOptions, type PageContext, type RegisteredAction, type RunTurnArgs, type RunTurnResult, runConversationTurn };
