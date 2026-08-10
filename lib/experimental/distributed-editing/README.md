# Distributed Editing Prototype (approval model)

Prototype of the server-authoritative save model discussed on
[Distributed Editing with unlimited Codex](https://collaborativeediting.wordpress.com/2026/07/02/distributed-editing-with-unlimited-codex/):
compare-and-swap versioning plus block-level capability enforcement, with
**hash-pinned approval** instead of per-op cryptographic attribution.

## Security invariant

Every top-level chunk of accepted `post_content` is one of:

1. **Byte-identical** to a chunk of the previously accepted content (untouched
   content passes through — including protected content an unprivileged user
   legitimately edited *around*).
2. **kses-filtered** (`wp_kses_post`).
3. **Explicitly approved**: a user with `unfiltered_html` approved the exact
   bytes, pinned by hash, in the same request that carried them.

Default-deny: unapproved protected changes are never trusted. For **every**
saver they are sequestered into a `de/pending-review` **void block** — a
single HTML comment carrying two escaped attributes:

- `proposed`: the exact proposed bytes, inert. Never rendered outside an
  explicit editor review; only an editor unwrap turns it into content, which
  re-enters evaluation as an ordinary protected chunk.
- `placeholder`: the kses-filtered safe version. The editor renders this in
  the collapsed state; the block's server **render callback** renders it on
  the front end. It is the *only* attribute that reaches output, so a
  wrapper's safety turns solely on the placeholder being kses-clean.
- Review happens **in-canvas** behind a **Review** button: collapsed, the
  block shows the safe placeholder rendered normally with a small "Pending
  review" affordance. Clicking Review reveals the proposal as editable raw
  text (never live DOM — the canvas is same-origin and privileged), with
  Approve / Reject / Close. Approving unwraps the (possibly modified) markup
  and it re-enters evaluation covered by the reviewer's approval hash;
  rejecting keeps the placeholder.
- A hand-crafted wrapper is handled by the same rule: if its `placeholder` is
  kses-clean it passes through (the inert `proposed` payload is harmless); if
  its `placeholder` carries active markup it is itself protected and gets
  re-sequestered, neutralizing the render-callback vector.
- Pure deletions of protected content are accepted without approval (no
  injection risk; classic kses would have stripped the content silently) and
  reported in the save result.

The void-block form (vs. inner content) is deliberate: the placeholder markup
contains block delimiters, which as inner content would reparse as nested
blocks and fail block validation. Keeping everything in escaped attributes
avoids that and keeps the chunk a single comment.

Because sequestration replaced the pending-edit meta log, proposals are
**co-located with `post_content`** — updates are atomic with the content they
annotate, resolving the meta race-condition caveat from the thread.

## Model notes

- **Versioning**: `version = sha256(accepted post_content)`. Any accepted
  change — including from plugins or direct `wp_update_post()` calls — moves
  the version, so stale distributed saves are rejected (`de_stale_base`, 409)
  and the client rebases. Merge intelligence is client-side; the server only
  arbitrates and validates (no server CRDT).
- **Chunking**: content is split into byte-exact top-level chunks (block,
  void block, or freeform run) without re-serializing; hashes are computed
  over exact bytes. Concatenating chunks reproduces the input.
- **Diff**: base and incoming chunks align via longest-common-subsequence on
  exact bytes; only unmatched incoming chunks are evaluated for protection.
- **Protected** means `wp_kses_post( $chunk ) !== $chunk` — content a user
  without `unfiltered_html` could not have authored.
- **Persistence** suspends the global kses save filters; the engine's own
  chunk-level enforcement replaces them (see invariant above).

## Native save integration (primary path)

Evaluation happens on the normal `wp/v2` save, not a separate sync request.
When a `posts`/`pages` update carries `de_base_version` (and optionally
`de_approvals[]`), `rest_pre_insert_{post_type}` runs the engine *before*
anything persists: stale bases bounce as 409 (`de_stale_base`); unapproved
protected changes never bounce — they sequester into pending-review blocks in
the accepted content. kses is suspended only for the DE-mediated
persist (the engine's invariant replaces it) and restored immediately after —
defensively again at `rest_request_after_callbacks`. Saves without
`de_base_version` keep legacy behavior untouched.

## Secondary REST surface (`gutenberg-de/v1`)

| Route | Method | Purpose |
| --- | --- | --- |
| `/posts/{id}/state` | GET | Version, content, chunk hashes + protected flags |
| `/posts/{id}/save` | POST | Standalone save for API clients: `content`, `base_version`, optional `approvals[]` |

All routes require `edit_post`. There are no pending-edit endpoints: review is
an ordinary save (unwrap + approval hash), so any client that can save can
review — approvals only carry weight from `unfiltered_html` holders.

## Editor client (`distributed-editing.js`)

A build-free client (WordPress script globals, enqueued on
`enqueue_block_editor_assets`) adds a **Distributed Editing** document panel:

- **Save-path middleware** — an `apiFetch` middleware decorates native editor
  saves with the tracked `de_base_version` and **auto-approval hashes** for
  every chunk actively present in the outgoing content, so ordinary
  Save/Publish is the collaboration entry point and a user's own protected
  edits save without ceremony. This is sound while there is no peer channel:
  everything in the editor was either loaded from accepted state
  (byte-identical pass-through) or authored locally, and sequestered payloads
  only enter content via the explicit Approve action. If a fast relay is
  added, auto-approval must be restricted to tracked local provenance.
- **Review block** — sequestered proposals render in-canvas as the
  `de/pending-review` block. **Collapsed by default**: the safe placeholder
  renders as normal content with a small "Pending review" affordance and a
  **Review** button; the raw proposed payload stays out of the DOM entirely
  until requested. Clicking Review reveals editable raw markup (approval
  applies exactly what is shown, never live DOM) and Approve / Reject / Close
  actions that unwrap on the next save. The recorded proposer is deliberately not surfaced in the UI:
  attribution in this model is transport-level and advisory, so displaying it
  as authorship would overstate what the server can vouch for. It remains in
  the block attributes for auditing.
- **Stale-base modal** — on `de_stale_base`, offers "Load server version" or
  an explicit destructive "Overwrite with mine" (no client merge in the
  prototype; a CRDT client would rebase here).
- **Sequestration feedback** — when the server sequesters instead of
  accepting, the editor adopts the accepted content (the wrapper appears in
  place of the proposal) and a notice points at the pending-review blocks.
- **Polling** — the accepted state is polled every 10s; a remote version
  change surfaces a "Load server version" notice (prototype stand-in for the
  relay plane).

## Trying the review flow

Auto-approval means an admin's own edits never sequester, so to see a
pending-review block either:

1. **Two users**: as an Author (no `unfiltered_html`), add a Custom HTML block
   with disallowed markup (e.g. a `<script>`) to their own post and save — the
   wrapper replaces the proposal in-canvas with a notice. Then open the post
   as an admin to review it.
2. **Single admin session**: in the editor console, run
   `window.__gutenbergDEBridge.disableAutoApprovals = true;` and save a
   protected change — it sequesters exactly as a foreign session's would.
   Set the flag back to `false` before saving an approval.

## Out of scope for this prototype

Dual-submit with a provisional peer overlay, presence, the optional fast
relay, and client-side merge/rebase (a CRDT client slots into the stale-base
path).

## Known gaps raised in discussion

- **Multisite `unfiltered_html`**: only super admins hold the capability on
  multisite (nobody does under `DISALLOW_UNFILTERED_HTML`), so the reviewer
  pool for pending edits collapses to network operators and the queue may
  have no local drain. Unresolved; the PHPUnit suite skips on multisite.
- **Coverage**: only the REST path is gated. XML-RPC and direct
  `wp_update_post()` callers bypass the engine; closing this means moving the
  hook down the stack.
- **Rubber-stamping**: a fatigued approval is the residual vulnerability.
  Default-deny, raw-markup rendering, in-context review, and the removal of
  the interrupting modal (which trains click-through) reduce but do not
  eliminate it. Auto-approval narrows the reviewed surface to genuinely
  foreign proposals.
- **Attribution**: CAS provides base coherence, not authorship. A saver with a
  fresh base can still carry relayed collaborators' unprotected content;
  witting ownership is only enforced at the protected boundary (the review
  flow).
- **Deactivated plugin**: with the block registered only by this plugin, a
  wrapper in stored content renders nothing on the front end if the plugin is
  off (the safe placeholder lives in an attribute the render callback reads).
  A Core implementation would register the block unconditionally.

Tests: `phpunit/experimental/distributed-editing-test.php` (engine/REST) and
`test/e2e/specs/editor/various/distributed-editing.spec.js` (editor flows).
