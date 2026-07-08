"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ActionRegistry: () => ActionRegistry,
  HttpAssistantClient: () => HttpAssistantClient,
  MockAssistantClient: () => MockAssistantClient,
  runConversationTurn: () => runConversationTurn
});
module.exports = __toCommonJS(index_exports);

// src/ActionRegistry.ts
var ActionRegistry = class {
  constructor() {
    this.actions = /* @__PURE__ */ new Map();
  }
  /** Register an action; returns an unregister function. */
  register(action) {
    this.actions.set(action.definition.id, action);
    return () => this.unregister(action.definition.id);
  }
  unregister(id) {
    this.actions.delete(id);
  }
  /** Serializable tool definitions visible in a scope ("global" always shown). */
  getToolDefinitions(scope) {
    return [...this.actions.values()].map((a) => a.definition).filter((d) => d.scope === "global" || d.scope === scope);
  }
  /** True when an action with this id is registered (drives the highlight). */
  has(id) {
    return this.actions.has(id);
  }
  list() {
    return [...this.actions.values()];
  }
  /** Execute a registered action's handler. */
  async execute(id, params, ctx) {
    const action = this.actions.get(id);
    if (!action) {
      return { ok: false, summary: `Unknown action: ${id}` };
    }
    return action.handler(params, ctx);
  }
};

// src/conversationLoop.ts
async function runConversationTurn(args) {
  const { client, registry, message, pageContext, signal } = args;
  const tools = registry.getToolDefinitions(pageContext.route);
  const history = [];
  const first = await client.send({ message, tools, pageContext }, history, signal);
  history.push(first);
  if (!first.toolCall) {
    return { text: first.text ?? "", sources: first.sources };
  }
  const ctx = {
    route: pageContext.route,
    snapshot: pageContext.snapshot
  };
  const result = await registry.execute(
    first.toolCall.name,
    first.toolCall.input,
    ctx
  );
  const second = await client.send(
    { message: result.summary, tools, pageContext },
    history,
    signal
  );
  return {
    text: second.text ?? result.summary,
    sources: second.sources,
    actionSummary: result.summary
  };
}

// src/HttpAssistantClient.ts
var HttpAssistantClient = class {
  constructor(options) {
    this.sessionId = null;
    this.opts = options;
    const f = options.fetchFn ?? globalThis.fetch;
    if (typeof f !== "function") {
      throw new Error(
        "HttpAssistantClient: no fetch available. Pass options.fetchFn."
      );
    }
    this.fetchFn = f.bind(globalThis);
  }
  /** Reset the conversation (start a fresh session on the next send). */
  resetSession() {
    this.sessionId = null;
  }
  async send(turn, _history, signal) {
    const body = { query: turn.message };
    if (this.sessionId) body.session_id = this.sessionId;
    const res = await this.fetchFn(this.opts.chatPath, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.opts.headers },
      body: JSON.stringify(body),
      credentials: this.opts.credentials ?? "omit",
      signal
    });
    if (!res.ok) {
      throw new Error(`Assistant service error: ${res.status}`);
    }
    const data = await res.json();
    if (data.session_id) this.sessionId = data.session_id;
    return {
      text: data.response ?? "",
      sources: extractCitations(data),
      toolCall: data.tool_call
    };
  }
  async listConversations() {
    if (!this.opts.conversationsPath) return [];
    const res = await this.fetchFn(this.opts.conversationsPath, {
      headers: { ...this.opts.headers },
      credentials: this.opts.credentials ?? "omit"
    });
    if (!res.ok) {
      throw new Error(`Assistant service error: ${res.status}`);
    }
    return await res.json();
  }
};
function extractCitations(data) {
  if (Array.isArray(data.sources) && data.sources.length > 0) {
    return data.sources.map(
      (s) => typeof s === "string" ? { url: s } : s
    );
  }
  const chunks = data.structured_data?.rag_chunks ?? [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const c of chunks) {
    const url = c.url ?? c.source ?? "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({
      url,
      title: c.title,
      sourceUid: c.source_uid,
      score: c.score
    });
  }
  return out;
}

// src/MockAssistantClient.ts
var MockAssistantClient = class {
  constructor(opts = {}) {
    this.opts = opts;
  }
  async send(turn, _history, _signal) {
    const reply = this.opts.reply ?? ((m) => `You said: ${m}`);
    const text = typeof reply === "function" ? reply(turn.message) : reply;
    return { text, sources: this.opts.sources };
  }
  async listConversations() {
    return this.opts.conversations ?? [];
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionRegistry,
  HttpAssistantClient,
  MockAssistantClient,
  runConversationTurn
});
