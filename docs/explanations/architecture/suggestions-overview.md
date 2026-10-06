# Suggestion mode: Architecture Overview for Reviewers

This page is the map. It explains how Suggestion mode fits together across the whole nine-PR stack, which PR owns which part, and where the design is still moving. The detailed reference, with every module, payload field and known limitation, is [Suggestions Architecture](./suggestions.md).

Tracking issue: [#73411](https://github.com/WordPress/gutenberg/issues/73411). Try it: [Playground for the combined branch #78994](https://playground.wordpress.net/gutenberg.html?pr=78994).

## Short version

**A suggestion is a pending change that lives in the post content, linked to a Note that carries its review thread.** A reviewer switches the editor to **Suggesting** (Suggestion mode), edits normally, and every edit is captured as a suggestion instead of being applied. The post author **Accepts** or **Rejects** each one from the Notes sidebar.

**There are three kinds of suggestion, captured three ways but stored in only two places.** Inline changes are marks in the block's content. Structural and attribute changes are a marker in the block's `metadata.suggestion`. Either way the pending state is part of `post_content`, and the Note carries the review thread. That split is the most important thing to understand before reading the code.

| | Inline text and formatting | Structural (insert, remove, move) | Block attributes (alignment, heading level, color) |
| --- | --- | --- | --- |
| Example | Type, delete, paste, bold a word | Delete a block, add a block, drag a block, paste a URL that becomes an Embed | Change H2 to H3, align center |
| Captured by | `beforeinput` / `cut` / plain-text `paste` "keyboards", plus a content reconciler for IME, autocorrect, drag-drop and pastes the editor transforms | Store interceptor (`registry.subscribe` diff) | `setAttributes` HOC, plus the store interceptor for direct dispatches |
| Pending state lives in | A `<mark class="wp-suggestion">` in the block's content | `metadata.suggestion` marker on the block, saved in `post_content` | The proposed values in `metadata.suggestion.after` (a `pending-attributes` marker, or `after` on a structural marker the block already has); the live attributes stay at the baseline |
| Note payload | `inline-suggestion` op | `block-insert-after` / `block-remove` / `block-move` op | `attribute-set` op |
| Survives reload | Yes | Yes | Yes |
| Front end before accept | `add` text hidden, `del` text shown, `format` shows the original | Pending insert hidden, pending move shown in its original order | Unchanged: the live attributes were never touched, and `metadata` never reaches front-end markup |

**Glossary**

- **Mode** (the `editorIntent` in code): Editing, Suggesting or Viewing, as in Google Docs. A session-only editor state, separate from the visual/code editor mode. Reloading always returns to Editing.
- **Note**: a `note`-type comment (the Notes feature, GA in WordPress 6.9). A suggestion is a Note with a JSON payload in `_wp_suggestion` comment meta and a lifecycle in `_wp_suggestion_status`.
- **Marker**: the in-content record of a pending suggestion. Inline markers are rich-text formats. Block markers live in `metadata.suggestion` and are typed `pending-insert`, `pending-remove`, `pending-move` or `pending-attributes`. Both kinds carry the Note's comment id.
- **Proposal**: the attribute values a block marker carries in `after`. In every mode the editor renders the block with the proposal merged over its live attributes, so everyone sees what is proposed. The HOC that does this is still named `withSuggestionOverlay`, from the in-memory overlay it replaced.
- **Session**: `SuggestionSessionProvider`, the in-memory coordination a suggesting tab needs (bypass tokens, handler slots, the write queue, structural capture records, the post title slot). It holds no block suggestion state.
- **Interceptor**: a data-registry subscriber that catches store changes made outside a block's own `setAttributes`, reverts them, and turns them into suggestions.

## At a glance

```mermaid
flowchart TB
    subgraph UI["Editor UI"]
        Switcher["Mode switcher<br/>Editing / Suggesting / Viewing"]
        Canvas["Block canvas"]
        Sidebar["Notes sidebar<br/>summary + Accept / Reject"]
    end

    subgraph Capture["Capture (Suggestion mode only)"]
        Keyboards["Input keyboards<br/>beforeinput, cut, paste"]
        Reconciler["Content and format<br/>reconcilers"]
        HOC["withSuggestionOverlay<br/>setAttributes HOC"]
        Interceptor["Store interceptor<br/>snapshot, diff, revert"]
    end

    subgraph State["Pending state (all in post_content)"]
        Inline["Inline markers<br/>mark.wp-suggestion in content"]
        BlockMarker["Block markers<br/>metadata.suggestion<br/>structural type + proposed after"]
    end

    subgraph Persist["Persistence"]
        AutoSave["Auto-save<br/>1.5 s debounce per block"]
        Provider["Submission and decision hooks<br/>create, update, apply, reject"]
        Store["SuggestionStore<br/>Note read / write"]
        REST["REST /wp/v2/comments<br/>note + _wp_suggestion meta"]
        Post["post_content"]
    end

    subgraph Server["Server render"]
        Strip["render_block strips<br/>and the_content move restore"]
    end

    Switcher --> Capture
    Canvas --> Keyboards & Reconciler & HOC
    Canvas -. direct dispatches .-> Interceptor
    Keyboards & Reconciler --> Inline
    HOC & Interceptor --> BlockMarker
    Keyboards & Reconciler -- open note first --> Provider
    BlockMarker --> AutoSave --> Provider --> Store --> REST
    Inline & BlockMarker --> Post
    Sidebar --> Provider
    Post --> Strip
```

Every marker is content, so it saves with the post, syncs over RTC and replays through undo like any other edit. Notes are created through the submission hook, which writes them through `SuggestionStore` (the swap point for a future Yjs backend), and are linked back to the block through `metadata.noteId` and the marker's id.

## The PR stack

Nine PRs, each based on the one below it. Review bottom up, and comment on the PR that owns the code. If time is short, [#80429](https://github.com/WordPress/gutenberg/pull/80429) and [#80431](https://github.com/WordPress/gutenberg/pull/80431) hold most of the logic.

```mermaid
flowchart BT
    T["trunk"]
    P1["1/9 #80427<br/>Editor mode + experiment gate"]
    P2["2/9 #80428<br/>Storage, REST, provider"]
    P3["3/9 #80429<br/>Block-level capture"]
    P4["4/9 #80430<br/>Inline marker primitive"]
    P5["5/9 #80431<br/>Inline suggestion operations"]
    P6["6/9 #80432<br/>Review UI"]
    P7["7/9 #80433<br/>Inline live wiring"]
    P8["8/9 #82047<br/>Architecture docs"]
    P9["9/9 #82048<br/>End-to-end tests"]
    T --> P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```

| Layer | PR | What it owns | Where to look |
| --- | --- | --- | --- |
| 1 | [#80427](https://github.com/WordPress/gutenberg/pull/80427) Editor mode (intent) | Session-scoped `editorIntent` in `core/editor` (private `setEditorIntent` / `getEditorIntent`), the Editing / Suggesting / Viewing switcher in the Options menu, Google Docs shortcuts (Shift+Alt+Cmd+Z/X/C), Viewing as read-only via `isPreviewMode`, the experiment gate `isSuggestionModeEnabled` / `useCanSuggest` | `editor/src/store/*`, `intent-switcher/`, `suggestion-mode/gate.ts` |
| 2 | [#80428](https://github.com/WordPress/gutenberg/pull/80428) Storage, REST, provider | `_wp_suggestion` and `_wp_suggestion_status` meta (64 KB cap, KSES on block snapshots), the 7.1 REST comment controller subclass, the first provider (create, update, apply, reject, schema versioning), an in-memory overlay store, the auto-save loop. No capture yet. #80433 later replaces the overlay and splits the provider | `lib/compat/wordpress-7.1/block-suggestions.php`, `suggestion-mode/provider.ts`, `overlay-context.tsx`, `auto-save.ts` |
| 3 | [#80429](https://github.com/WordPress/gutenberg/pull/80429) Block-level capture | Store interceptor (attribute drift and structural insert / remove / move, list indent and outdent), the `setAttributes` HOC, pending treatments and move ghosts, revert and undo guards, PHP structural strip and move-order restore | `suggestion-mode/store-interceptor.ts`, `with-suggestion-overlay.tsx`, `block-list/content-suggestion.scss` |
| 4 | [#80430](https://github.com/WordPress/gutenberg/pull/80430) Inline marker primitive | Format-agnostic rich-text utilities shared with Notes: wrap a range, find a marker by id (the only offset resolver), read caret and selection, reconcile after edits, decorate via annotations | `editor/src/components/inline-markers/` |
| 5 | [#80431](https://github.com/WordPress/gutenberg/pull/80431) Inline operations | Pure functions: the `core/suggestion` format, create / accept / reject for `add`, `del` and `format`, edit and format planners, word and line delete ranges, marker stripping | `editor/src/components/inline-suggestions/` |
| 6 | [#80432](https://github.com/WordPress/gutenberg/pull/80432) Review UI | Accept / Reject in the note header, the Docs-style summary ("Add: ...", "Delete: ...", "Change: heading level 2 to 3") with a bounded word diff | `collab-sidebar/suggestion-actions.tsx`, `suggestion-mode/suggestion-summary.tsx` |
| 7 | [#80433](https://github.com/WordPress/gutenberg/pull/80433) Inline live wiring | The addition, deletion and format keyboards, the content reconciler, author colors and marker reveal, Note garbage collection, post title suggestions, clipboard strip, refusals (post status, publish), List View labels, PHP inline strip, a `core-data` CRDT serializer fix. Also the move of attribute suggestions onto the block marker (the overlay context becomes `suggestion-session.tsx`, auto-save walks markers) and the provider split into `SuggestionStore`, submission and decision hooks, and pure `operations/` | `suggestion-mode/suggestion-*-keyboard.ts`, `suggestion-content-reconciler.ts`, `suggestion-note-gc.ts`, `marker.ts`, `suggestion-session.tsx`, `suggestion-store.ts`, `use-suggestion-*.ts`, `operations/` |
| 8 | [#82047](https://github.com/WordPress/gutenberg/pull/82047) Docs | This page and [suggestions.md](./suggestions.md) | `docs/explanations/architecture/` |
| 9 | [#82048](https://github.com/WordPress/gutenberg/pull/82048) E2E | 19 Playwright specs covering every path above, plus perf harness changes. No production code | `test/e2e/specs/editor/various/suggestion-mode*.spec.ts`, `test/e2e/specs/site-editor/suggestion-mode-intent-shortcuts.spec.ts` |

Some files are deliberately split across layers: `with-suggestion-overlay.tsx` and `store-interceptor.ts` start in #80429 and gain inline hand-offs in #80433; `provider.ts` starts in #80428 and becomes a thin composition of `SuggestionStore` and the submission and decision hooks in #80433; `overlay-context.tsx` starts in #80428 and is replaced by `suggestion-session.tsx` and `marker.ts` in #80433; `block-suggestions.php` gains meta in #80428, the structural strip in #80429 and the inline strip in #80433.

About 30 focused fix PRs (F-01 to F-34, for example [#81661](https://github.com/WordPress/gutenberg/pull/81661), [#81669](https://github.com/WordPress/gutenberg/pull/81669), [#81656](https://github.com/WordPress/gutenberg/pull/81656)) were reviewed on their own and then folded into the layer that owns the code. They are listed in [#73411](https://github.com/WordPress/gutenberg/issues/73411).

## Data model

```mermaid
erDiagram
    POST ||--o{ BLOCK : "post_content"
    BLOCK ||--o{ INLINE_MARKER : "rich-text content"
    BLOCK ||--o| BLOCK_MARKER : "metadata.suggestion"
    BLOCK }o--o{ NOTE : "metadata.noteId"
    INLINE_MARKER }o--|| NOTE : "data-suggestion-id"
    BLOCK_MARKER }o--|| NOTE : "commentId"
    NOTE ||--|| PAYLOAD : "_wp_suggestion meta"

    INLINE_MARKER {
        string type "add, del, format"
        int suggestionId "note comment id"
        int author "user id"
    }
    BLOCK_MARKER {
        string type "pending-insert, pending-remove, pending-move, pending-attributes"
        object after "proposed attribute values"
        int commentId
        int authorId
        bool crossedParents
    }
    NOTE {
        string comment_type "note"
        string status "hold or approved"
        string suggestion_status "pending, applied, rejected"
    }
    PAYLOAD {
        int schemaVersion "2"
        string blockName
        array operations
    }
```

Three rules hold the model together:

1. **Offsets are never stored.** An inline marker is found by id on every read (`findMarkerRange`), so unrelated edits elsewhere in the block do not break it. This is also the planned swap point for Yjs attribution.
2. **Operations describe intent, not diffs.** A payload is a list of declarative ops (`attribute-set`, `block-insert-after`, `block-remove`, `block-move`, `inline-suggestion`, `post-attribute-set`). Accept replays them against the current block, and conflicts are checked per attribute.
3. **Two status axes.** The comment status (open or resolved discussion) and `_wp_suggestion_status` (pending, applied, rejected) are independent, so a decided suggestion can keep its thread open.

The inline marker serializes as:

```html
<mark class="wp-suggestion" data-suggestion-id="42" data-suggestion-type="add" data-author="7">new words</mark>
```

## Data flow: an inline text suggestion

Typing in Suggestion mode never lets the browser edit the text directly. The keyboard cancels the native input, opens a Note, then writes the marked text.

```mermaid
sequenceDiagram
    autonumber
    participant R as Reviewer
    participant K as Addition keyboard
    participant Q as Per-block write queue
    participant P as Provider
    participant API as REST comments
    participant S as Block editor store

    R->>K: Types "new" at a caret
    K->>K: beforeinput captured, native edit cancelled
    K->>P: createSuggestion (first keystroke of the run)
    P->>API: POST note, _wp_suggestion = inline-suggestion op
    Note over K: Further keystrokes buffered while the note is in flight
    API-->>P: comment id 42
    P-->>K: 42
    K->>Q: Enqueue marker write
    Q->>Q: Rebase run anchor onto current content
    Q->>S: updateBlockAttributes with mark id 42 (interceptor bypassed)
    S-->>R: Text shown underlined in the author color
    Note over S: Later keystrokes in the same run grow the same marker and note
```

Deletes work the same way, wrapping the removed range in a `del` marker. Type-over produces one `replace` note with a `del` and an `add` run. Bold, italic and links produce one `format` marker whose Note records the original run as `beforeHTML`. Edits that arrive only as a new `content` value (IME commit, autocorrect, drag-drop) are diffed by the content reconciler into the same markers. The paste handler only takes a paste the editor would insert as exact plain text. Any paste the editor transforms (Markdown, a linked email, a URL over a selection, formatting a Code block drops) goes through the normal paste pipeline, so the result matches Editing mode, and the reconciler proposes it.

An edit that would overlap someone else's marker is declined with a notice rather than nesting markers.

## Data flow: a structural suggestion

Structural changes are caught after the fact, because they can come from many places (toolbar, keyboard, drag, List View, block switcher).

```mermaid
sequenceDiagram
    autonumber
    participant R as Reviewer
    participant S as Block editor store
    participant I as Store interceptor
    participant A as Auto-save
    participant P as Provider
    participant API as REST comments

    R->>S: Deletes a block
    S-->>I: registry.subscribe fires
    I->>I: Diff against previous snapshot, finds a removal
    I->>S: Re-insert the block, tag metadata.suggestion = pending-remove
    S-->>R: Block shown struck through and dimmed
    I->>A: Record block-remove op for this block
    A->>A: Wait 1.5 s of idle on the block
    A->>P: createSuggestion
    P->>API: POST note, _wp_suggestion = block-remove op
    API-->>P: comment id
    P->>S: Write metadata.noteId on the block
```

Inserts keep the new block in place and tag it `pending-insert`. Moves keep the block at its new position, tag it `pending-move` with from and to anchors, and draw a ghost at the origin. A list indent or outdent is captured as a move of the item, not as an insert plus a remove. A paste that converts to a block (a URL in an empty paragraph to an Embed, LaTeX to a Math block) is a block replacement: a `pending-remove` paragraph and a `pending-insert` block in one group.

## Data flow: a block attribute suggestion

```mermaid
sequenceDiagram
    autonumber
    participant R as Reviewer
    participant H as withSuggestionOverlay HOC
    participant M as metadata.suggestion
    participant A as Auto-save
    participant P as Submission hook
    participant API as REST comments

    R->>H: Changes heading level 2 to 3
    H->>M: Divert setAttributes into after.level = 3 (pending-attributes)
    M-->>H: Render live attributes merged with after
    H-->>R: Block shows level 3 with the pending bracket, in every mode
    M->>A: Marker changed
    A->>A: Wait 1.5 s of idle on the block
    A->>P: createSuggestion or updateSuggestion
    P->>API: POST or PUT note, _wp_suggestion = attribute-set op
    P->>M: Write the note id onto the marker as commentId
    Note over M: The live level attribute stays 2. The proposal saves, syncs and undoes as content
```

Changes that skip `setAttributes` (for example the block switcher's variation picker dispatching `updateBlockAttributes` directly) are caught by the interceptor, reverted, and written into the same proposal. Undo withdraws a proposal like any other edit, and the Note collector trashes its Note. Redo puts the marker back, and because its Note is now in the trash, auto-save saves the returned proposal as a new Note. A marker left proposing nothing trashes its Note too. Note ids read from content are only hints: auto-save acts on one only when core-data shows it as a pending Note on this post.

## Review: accept and reject

```mermaid
sequenceDiagram
    autonumber
    participant Au as Post author
    participant SB as Notes sidebar
    participant P as Provider
    participant I as Store interceptor
    participant S as Block editor store
    participant API as REST comments

    Au->>SB: Accept on a suggestion card
    SB->>P: applySuggestion
    alt Targeted attribute changed since capture
        P-->>Au: Confirm "Apply anyway?"
    end
    P->>I: requestInterceptorBypass for this block
    alt Inline marker
        P->>S: Unwrap add, remove del text, keep format
    else Structural
        P->>S: removeBlock / insertBlock / moveBlockToPosition, clear marker
    else Attribute
        P->>S: updateBlockAttributes with applyOperations, drop the proposal from the marker
    end
    P->>API: PUT status approved, _wp_suggestion_status = applied
```

Reject is the mirror image: drop an `add` with its text, unwrap a `del`, restore a `format` run from `beforeHTML`, undo a pending insert or move, clear a `pending-remove` marker, or drop an attribute proposal. Clearing a structural marker keeps a proposal that rode on it as its own `pending-attributes` marker. Decisions are kept out of undo history (`history: 'ignore'`).

## Persistence and the front end

Because inline and structural markers are saved in `post_content`, the server must keep pending suggestions off the published page. It does that at render time, so the stored content and REST `raw` keep the markers for the editor.

```mermaid
flowchart LR
    PC["post_content<br/>with markers"] --> TC["the_content, priority 8<br/>restore pending move order"]
    TC --> RB["render_block filters"]
    RB --> Ins["pending-insert block<br/>dropped"]
    RB --> Add["add marker<br/>wrapper and text dropped"]
    RB --> Del["del marker<br/>wrapper dropped, text kept"]
    RB --> Fmt["format marker<br/>replaced by original run"]
    RB --> Rem["pending-remove block<br/>rendered as normal"]
    RB --> Att["pending-attributes block<br/>live attributes, no PHP needed"]
    Ins & Add & Del & Fmt & Rem & Att --> Out["Published HTML<br/>as if nothing were pending"]
```

All of this lives in `lib/compat/wordpress-7.1/block-suggestions.php`. Permissions are core's: any user who can `edit_post` on the parent can resolve a Note. The REST controller subclass only adds payload validation (413 for oversize, 400 for invalid JSON) and allows empty note content.

## Collaboration and undo

- **RTC.** All markers, attribute proposals included, sync as ordinary content. When one peer accepts an attribute suggestion, the other peer's interceptor would see that change as drift and revert it. `isAcceptedSuggestionChange` checks the linked Notes' payloads and adopts the change instead. Locally, `requestInterceptorBypass` does the same for the accepting peer.
- **Undo.** Undoing a suggestion edit removes its marker. `SuggestionNoteGC` notices the anchor is gone and trashes the Note. On redo an inline marker gets its Note restored; a redone attribute proposal is saved as a new Note (see above). Notes with replies are spared. `suggestion-undo-guard.ts` handles adoption so undo and redo do not get captured as fresh suggestions.
- **Concurrency.** Each block has a serial write queue, so the format keyboard and content reconciler cannot interleave their note-then-marker writes. A run whose surrounding text changed during the Note request is abandoned and its Note trashed.

## Open findings

An architecture review on 2026-10-04 found the data model sound and the cost concentrated in the mechanism. Two of its changes have landed in #80433: attribute suggestions now live on the block marker instead of an in-memory overlay (A2), and the provider is split behind a `SuggestionStore` boundary (A5). The rest are recorded but not scheduled:

- **A1.** The interceptor is effectively a second reducer outside the store. A private block-editor action interceptor would be cleaner.
- **A3.** Marker ids are server comment ids, so the first keystroke waits on a REST round trip. Client-generated ids would remove the buffering.
- **A4.** Input is captured at the DOM `beforeinput` level. A private `transformChange` hook on `useRichText` would sit at the right altitude, and depends on A3.

One product question is open: a block has one marker, so a second suggester's attribute change to a block that already has a pending proposal joins the first suggester's marker and Note.

## Questions for reviewers

1. Is the two-place storage (inline marks in content, one `metadata.suggestion` marker per block) the right shape?
2. Should a block hold one marker per suggester, or is one shared marker acceptable while concurrent suggestions ([#79220](https://github.com/WordPress/gutenberg/issues/79220)) are paused?
3. Is a data-registry subscriber the right capture point for structural changes, or should block-editor grow a private action-interceptor API (A1)?
4. Should the marker id stay the server comment id, or move to a client-generated id that the Note adopts (A3)?
5. Is it acceptable that pending `add` text and proposed attribute values are visible in `post_content` and REST `raw` to anyone who can read raw content?
6. Should suggestions be tied to a post revision?
7. Should the `core-data` CRDT serializer fix and the perf harness change land on trunk ahead of the stack?
8. `block-suggestions.php` targets `lib/compat/wordpress-7.1/`. Which release should it target now?

## Further reading

- [Suggestions Architecture](./suggestions.md): the full reference (module tables, payload schema, every known limitation).
- [#73411](https://github.com/WordPress/gutenberg/issues/73411): tracking issue, testing walkthrough and fix PR list.
- [#78994](https://github.com/WordPress/gutenberg/pull/78994): combined branch for Playground testing.
- [#77005](https://github.com/WordPress/gutenberg/pull/77005): Yjs v14 and `AttributionManager`, the future storage backend.
- [#78218](https://github.com/WordPress/gutenberg/pull/78218): the Notes inline anchor the marker primitive grew from.
