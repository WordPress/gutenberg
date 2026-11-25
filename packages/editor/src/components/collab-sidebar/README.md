# Notes Sidebar

The Notes sidebar (a.k.a. collab sidebar) lets users attach threaded notes to individual blocks. It renders in two modes:

- **All notes** - a full sidebar (opened from the editor's More menu) listing every note thread on the current post.
- **Floating notes** - on larger viewports, unresolved notes also float next to their associated blocks in the canvas, positioned to track scroll and avoid overlap.

Notes are stored as WordPress comments (`type: 'note'`) attached to the post. A block references its thread via `metadata.noteId` on block attributes. Each thread has a top-level note plus replies; threads can be resolved (stored as status `approved`) or reopened.

## File structure

The components are in the hierarchy below. Besides them:

- `hooks.js`: `useNoteThreads`, `useNoteActions`, `useNoteDraft`, `useNoteSelection`, `usePickNote`, `useNoteFocus`, `useFloatingBoard`.
- `utils/`: pure helpers, one module per concern. See the table below.
- `board-store.js`: DOM measurement for the floating layout, see "Floating board".
- `note-highlight-styles.js`: the canvas tint for notes and their markers.
- `format.js`: the `core/note` format that serializes an inline note's marker.
- `notes-filters.tsx`, `notes-display-mode-menu.tsx`: the sidebar's filters and the Options menu's Notes submenu.
- `rich-text-control/`, `note-mention-completer.tsx`: the note form's rich text field and its `@` mentions.
- `reactions/`: emoji reactions on a note.

| `utils/` module | Owns |
| --- | --- |
| `note-format` | `core/note` markers on rich text records, shaped like rich-text's `applyFormat` and `removeFormat` |
| `note-anchor` | Markers in block attributes: finding, wrapping and removing them, and which blocks hold a note at block level |
| `rich-text` | Converting attribute values to records and back. Local copies of block editor helpers that aren't exported name their originals |
| `note-selection` | The caret rules, see "Note selection" |
| `metadata` | `metadata.noteId` |
| `dom` | Marker selectors, anchor rects, focusing and scrolling threads |
| `layout` | Floating thread positions, see "Floating board" |
| `display` | Excerpts and avatar colors |
| `threads` | Nesting replies under their root note, and splitting threads by status |

## Component hierarchy

```text
NotesSidebarContainer (index.jsx)         - gates on post type support, owns the unsent drafts Map
 └── NotesSidebar (index.jsx)             - owns sidebarRef + useNoteThreads + useNoteSelection + sidebar registration
      ├── AddNoteMenuItem                - slot fill in the block options menu
      ├── AddNoteToolbarButton           - slot fill in the block toolbar (once the post has notes)
      ├── PluginSidebar (all-notes)      - full sidebar
      │    └── Notes (notes.jsx)          - owns outer Stack + aria-label + useNoteFocus + keyboard nav + focusThreadOrAdjacent
      │         ├── AddNote              - new note form for the selected blocks, rendered when selectedNote === 'new', calls useNoteActions
      │         └── NoteThread[]         - per thread, calls useNoteActions
      │              └── <FloatingContainer>
      │                   ├── Note       - top-level note (own state: edit/delete/dialog)
      │                   │    └── NoteCard
      │                   │         └── NoteByline + actions slot + body children
      │                   ├── Note[]     - replies (when selected)
      │                   └── NoteReply  - inline reply form (when selected)
      └── PluginSidebar (floating)       - floating sidebar (large viewport, unresolved notes)
           └── Notes (same)              - isFloating
```

`Notes` is reused for both sidebar surfaces. The only visual difference is driven by `isFloating` (whether to layer threads over the canvas or stack them in a panel).

Unsent note and reply text lives in a `Map` owned by `NotesSidebarContainer`, keyed by block client ID or note ID, so it survives the forms unmounting. It is a cache, not state: `useNoteDraft` reads it on mount and writes it on change, so typing doesn't re-render the sidebar. Slot fills don't inherit context, so `NotesSidebar` provides it inside each fill. The text a new note is started from is wrapped with a `core/note` marker whose id is `new`, the same sentinel `selectNote` uses for the form, until the note is sent, so the anchor follows edits like a saved note's does; `onCreate` swaps in the saved id, and each exit from an empty form strips it with `onDiscard` at the point of exit: Cancel, the form's focus-out, and `useNoteSelection` when the caret moves the selection away from `new`.

A new note is added to the selected blocks, so selecting several blocks, or text across them, adds one note to each, as if added to each block on its own; from then on it is a note shared by several blocks. Each block's `new` marker wraps the text a format applied across blocks would (`getNoteRanges`). A text block the selection gives no text, like the one it starts at the end of, is left out, unless no block has any. A block without a sole rich text field, like an Image, takes the note without a marker and holds it at block level, unlike a text block a split left without the note's marker; `getBlockLevelClientIds` decides this for both the tint and the caret. The selection stays while the form is open, and the form's blocks are the selected blocks; moving either end of a selection across blocks leaves the form, as entering another block does. Starting a note across blocks strips any `new` marker from them, since one left by a single block's unsent draft isn't this note's. Its text is kept under the first; only a draft on one block keeps its marker when the form is left, so a draft across blocks comes back on its first block.

## Note selection

The selected note is a small state machine driven by the caret. `useCaretChange` reports caret moves from a block-editor store subscription, filtered by `getCaretChange`, and `useNoteSelection` applies `pickNoteForCaret`, which holds the transitions. The tests in `test/note-selection.jsdom.test.ts` have one `describe` per row of this table, so a rule change is a change to both. Three caret events change the selected note, and everything else leaves it alone:

| Caret event | Selected note becomes |
| --- | --- |
| Enters a marker | That note, or the new note form for the `new` marker |
| Enters another block, or moves an end of a selection across blocks | The block's note: its unsent draft, else a block-level note (the selected one, else the primary), else none |
| Leaves the selected note's marker | The block's note, as above |
| Anything else: typing, moving in plain text, a caret not reported yet | Unchanged |

A block-level note is one the block holds at block level, see `getBlockLevelClientIds`, so a text block a split left with the note's id but none of its text doesn't select it. "Anything else" is what keeps explicit actions in place: a block-level note collapsed with Escape stays collapsed while editing, since a block-level note has no caret position. A caret not reported yet is unknown, not outside: RichText reports no offsets on focus until mouseup, and `selectBlock` stores none.

Explicit actions set the selected note directly:

| Action | Effect |
| --- | --- |
| Thread click, avatar, keyboard expand, Add note | `usePickNote`: selects the block, then the note, so the caret events run on the block change before the pick lands |
| Escape | None, until one of the caret events above |
| Cancel, the new note form's focus-out | Strips the draft marker, none |

A thread's or the new note form's focus-out deselects only when focus did not land in one of its blocks, see `isFocusInBlocks`; in those blocks, the caret events decide. While the canvas is the editing host (the selected block supports `editableRoot`), the host holds focus, so the block holding the caret counts.

## Floating board

Goal: in the floating sidebar, each unresolved note appears beside its associated block, tracks canvas scroll, and shifts up/down to avoid overlapping with neighbors - all without re-rendering threads as the canvas scrolls.

A note shared by several blocks has one place: beside its first block, whichever of its blocks is selected. Hovering or focusing the thread highlights that block, picking the thread selects it, and Back to block returns to it.

Three layers cooperate:

### 1. `board-store.js` - DOM measurement

A plain JS store created via `createBoardStore()` (one per mounted `Notes`). It is the only place that reads layout for the thread positions; the scroll mirror in `useMirroredScroll` reads the canvas's scroll range separately. It holds:

- `blockRefs: Map<noteId, HTMLElement>` - each note's associated block element.
- `floatingRefs: Map<noteId, HTMLElement>` - each note's floating DOM node.
- `idByElement: WeakMap<HTMLElement, noteId>` - reverse lookup for the `ResizeObserver`.
- `rootEl` / `canvas` / `frameEl` - the block-list root (`.is-root-container`, found from the first registered block), its scroll container, and the canvas `iframe`. When the root changes, the observers are rebuilt.
- `snapshot: { heights, anchorRects, canvas, frameOffset }` - plain data for `useSyncExternalStore`. `anchorRects[id].top` is in canvas content-space (viewport top + `scrollTop`), so scrolling alone never changes it. `frameOffset` is the canvas frame's top minus the top of the threads' container (their `offsetParent`): anchors are read in the frame's viewport, threads are positioned in the container, and anything above the canvas (e.g. an editor notice or the device preview inset) separates the two.

One `ResizeObserver` watches:

- each floating element, for thread heights;
- the root, so editing, adding or removing a block re-anchors the threads below it;
- the root's parent, which grows when content above the root (e.g. a wrapping post title) moves the root without resizing it;
- the canvas frame, which shrinks when content above the canvas moves it. A frame that moves without resizing isn't detected.

Each callback runs `measure()`, which reads the heights and anchors (via `getNoteAnchorRect()` in `utils/dom.ts`) and emits only when a value changed.

A `MutationObserver` watches `style` attributes under the root. The block move animation offsets moved blocks with a transform, which resizes nothing, so the first pass reads their old positions. The observer calls `requestMeasure()` once a changed element has no transform, so threads move when the animation ends rather than on every frame.

API:

- `subscribe(listener)` / `getSnapshot()` - wired to React via `useSyncExternalStore`. The observers only exist while there are subscribers: the first subscriber creates them and observes everything already registered, the last one disconnects them.
- `registerThread(id, blockEl, floatingEl)` - called by each `NoteThread` once mounted. Updates the refs, swaps the observed floating element, and requests a measurement.
- `unregisterThread(id)` - inverse; called on unmount.
- `requestMeasure()` - asks for a new pass when anchors may move without anything resizing or re-registering (e.g. blocks reordered).

Registering never measures directly. `requestMeasure()` re-observes the root; a new observation always reports once, so the observer runs another pass before the next paint, together with any other resizes in that frame.

`getNoteAnchorRect(noteId, blockEl)` resolves the anchor at read time, because rich-text re-renders replace the marker element: an inline note, the pending `new` note included, anchors to its marker, and anything else to its block.

### 2. `useFloatingBoard` - the React bridge (in `hooks.js`)

Lives inside `Notes`. Holds one store instance (`useState(createBoardStore)`) and:

1. Subscribes via `useSyncExternalStore` only while floating; otherwise it passes a no-op subscribe, so the store drops its observer.
2. Requests a measurement whenever `threads` changes. `threads` is rebuilt on any block insert, removal or move, which can shift anchors without resizing the root.
3. Derives `notePositions` during render with `useMemo( () => getThreadLayout(...) )` from `threads`, `selectedNoteId` and the snapshot. There is no state, timer or rAF: React re-renders synchronously on a store change, so a resize reaches the screen in the same paint.
4. `useCanvasRoom`: in a layout effect keyed on `isFloating + canvas + contentHeight`, writes the `contentHeight` from the same `getThreadLayout` call as `--wp-editor-canvas-min-height` on the canvas root. The canvas margin's CSS (`getCanvasMarginCSS` in `visual-editor/canvas-margin.js`) applies it as the root's `min-height` inside its tiers, so a short post can always scroll to the lowest thread and the room goes away with the margin. The value changes at most twice per selection change (new positions, then the expanded thread's measured height), both before the next paint.
5. `useMirroredScroll`: in a layout effect keyed on `isFloating + sidebarRef + canvas`, mirrors the panel and the canvas. The floating panel is a real scroller (`overflow-y: auto`, hidden scrollbar) whose `::before` spacer gives it the canvas's scroll range, written as `--canvas-scroll-range` from a `ResizeObserver` on the canvas root, its body and the panel. A `scroll` listener on each side scrolls the other to its position, and the canvas owns the position: when it can't follow the panel, the panel snaps back. The code comments cover the details (instant scrolls, the echo guard, why the observer never sets positions).
6. `usePanelOffsets`: writes the snapshot's `frameOffset` as `--canvas-offset` and `scrollbarWidth` as `--canvas-scrollbar-width` on the panel.
7. Returns `{ notePositions, heights, registerThread, unregisterThread }` - the positions and heights flow down as props; the two register callbacks flow to each `NoteThread`.

### 3. `getThreadLayout` - pure layout math (in `utils/layout.ts`)

Given the threads, the selected note id, the anchor rects and the floating heights, returns `{ positions: { [noteId]: top }, contentHeight }` in canvas content-space. The selected note (else the first thread) stays beside its anchor, and two sweeps from it push the threads below down and the threads above up until none overlap.

### 4. `FloatingContainer` - the render shell

Renders a `Stack` with `top: floating.y` when in floating mode. CSS translates each thread by `--canvas-offset`, so it tracks the canvas frame; the panel's own scroll, mirrored with the canvas, tracks the canvas scroll, so per-thread `top` values stay stable while scrolling. A `top` transition eases reflows (e.g. on selection change) unless the user prefers reduced motion; a thread's first positioning starts from `top: auto` and doesn't animate.

### Why this shape

Each layer has one job, so a new anchor type or layout rule touches only one of them:

- DOM reads happen only in `measure()`, inside the `ResizeObserver` callback. It runs after layout and before paint, so reads are cheap, the result is painted in the same frame, and the browser's resize-loop detection covers any feedback between positions and sizes. Don't add rAFs or timers around it.
- The snapshot is plain data compared by value, so unrelated resizes don't re-render `Notes`.
- Observer lifetime follows subscriptions, so remounts (and StrictMode's double effects) rebuild it from the registered refs.
- `getThreadLayout` is pure and derived during render; anything computable from props, state and the snapshot should stay out of React state.
- The scroll listeners mirror scroll positions and the range observer updates a CSS variable, never React state, so scrolling doesn't re-render.

## Style Book notes

Notes also work in the Style Book, in `../style-book/notes/`. The surface differs from the post editor in two ways that shape the code here.

**There is no edited post.** The Style Book is opened from the styles canvas, where the editor is editing a template. Notes are stored against the current theme's user `wp_global_styles` post instead - the record the Styles UI already edits - which makes them theme-specific, since core keeps one per theme. `useNoteActions` takes a `postId` for this. Passing one also turns off the block-attribute wiring, which is not merely unnecessary there but harmful: the canvas usually has a block selected, and `metadata.noteId` would land on it.

**There are no persisted blocks.** Style Book examples are generated on every render and get fresh client ids, so `metadata.noteId` cannot anchor anything. Each note instead carries a `_wp_note_anchor` comment meta holding the example's name - `core/button`, `typography`, `theme-colors` - which is deterministic and stable across sessions and reloads. The server side is in `lib/compat/wordpress-7.2/global-styles-notes.php`.

What is shared: `NoteThread` and the note/reply/form components, `useNoteActions`, and the thread-materialization helpers in `utils/threads`. What is not: the thread list, because the post editor's keeps note selection in step with block selection and spotlights the anchored block.

`NoteThread` takes an optional `anchorLabel` for this. Without one, a root note with no block means the block was deleted, and the thread says so - true in the post editor, wrong for every Style Book note.

Anchors that no longer match a rendered example - a deactivated block plugin, a renamed example - group under "Other notes" rather than disappearing, mirroring how orphaned notes stay visible in `useNoteThreads`.
