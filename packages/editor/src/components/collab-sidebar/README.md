# Notes Sidebar

The Notes sidebar (a.k.a. collab sidebar) lets users attach threaded notes to individual blocks. It renders in two modes:

- **All notes** - a full sidebar (opened from the editor's More menu) listing every note thread on the current post.
- **Floating notes** - on larger viewports, unresolved notes also float next to their associated blocks in the canvas, positioned to track scroll and avoid overlap.

Notes are stored as WordPress comments (`type: 'note'`) attached to the post. A block references its thread via `metadata.noteId` on block attributes. Each thread has a top-level note plus replies; threads can be resolved (stored as status `approved`) or reopened.

## File structure

```
collab-sidebar/
├── README.md                       this file
├── index.jsx                        NotesSidebarContainer → NotesSidebar (entry, toolbar slot fills)
├── notes.jsx                        Notes - coordinator (outer Stack, actions, keyboard nav)
├── note-thread.jsx                  NoteThread - per-thread (selection, floating registration, reply form)
├── note.jsx                         Note - per-card state (edit/delete mode, menu, dialog)
├── note-card.jsx                    NoteCard - presentational shell (byline + actions slot + children)
├── note-byline.jsx                  NoteByline - avatar + name + relative date
├── note-form.jsx                    NoteForm - rich text input + submit/cancel
├── add-note.jsx                     AddNote - new-note surface (floating + template-locked cases)
├── add-note-menu-item.jsx           AddNoteMenuItem - block options menu "Add note" trigger
├── add-note-toolbar-button.tsx      AddNoteToolbarButton - block-toolbar "Add note" trigger
├── note-indicator-toolbar.jsx       NoteAvatarIndicator - toolbar participants avatars
├── floating-container.jsx           FloatingContainer - stack wrapper that applies `top` in floating mode
│
├── hooks.js                        useNoteThreads, useNoteActions, useNoteSelection, usePickNote, useNoteFocus, useFloatingBoard, useEnableFloatingSidebar
├── utils.js                        focusNoteThread, getNoteExcerpt, sanitizeNoteContent, calculateNotePositions, getAvatarBorderColor
├── board-store.js                  createBoardStore - DOM measurement for the floating layout
├── constants.js                    sidebar identifier strings
├── style.scss
└── test/
    └── utils.js
```

## Component hierarchy

```
NotesSidebarContainer (index.jsx)         - gates on post type support, owns the unsent drafts Map
 └── NotesSidebar (index.jsx)             - owns sidebarRef + useNoteThreads + useNoteSelection + sidebar registration
      ├── AddNoteMenuItem                - slot fill in the block options menu
      ├── AddNoteToolbarButton           - slot fill in the block toolbar (once the post has notes)
      ├── NoteAvatarIndicator            - slot fill in the block toolbar (per-thread avatars)
      ├── PluginSidebar (all-notes)      - full sidebar
      │    └── Notes (notes.jsx)          - owns outer Stack + aria-label + useNoteActions + useNoteFocus + keyboard nav
      │         ├── AddNote              - new note form for the selected block, rendered when selectedNote === 'new'
      │         └── NoteThread[]         - per thread
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

## Note selection

The selected note is a small state machine driven by the caret. `useCaretChange` reports caret moves from a block-editor store subscription, and `useNoteSelection` applies `pickNoteForCaret`, which holds the transitions. Three caret events change the selected note, and everything else leaves it alone:

| Caret event | Selected note becomes |
| --- | --- |
| Enters a marker | That note, or the new note form for the `new` marker |
| Enters another block | The block's note: its unsent draft, else a block-level note (the selected one, else the primary), else none |
| Leaves the selected note's marker | The block's note, as above |
| Anything else: typing, moving in plain text, a caret not reported yet | Unchanged |

Typing is skipped before the rule runs: a selection change that comes with a change to the block's content moves the caret along with the text, never across a marker. "Anything else" is what keeps explicit actions in place: a block-level note collapsed with Escape stays collapsed while editing, since a block-level note has no caret position. A caret not reported yet is unknown, not outside: RichText reports no offsets on focus until mouseup, and `selectBlock` stores none.

Explicit actions set the selected note directly:

| Action | Effect |
| --- | --- |
| Thread click, avatar, keyboard expand, Add note | `usePickNote`: selects the block, then the note, so the caret events run on the block change before the pick lands |
| Escape | None, until one of the caret events above |
| Cancel, the new note form's focus-out | Strips the draft marker, none |

A thread's or the new note form's focus-out deselects only when focus did not land in its block; in the block, the caret events decide.

## Floating board

Goal: in the floating sidebar, each unresolved note appears beside its associated block, tracks canvas scroll, and shifts up/down to avoid overlapping with neighbors - all without re-rendering threads as the canvas scrolls.

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

Each callback runs `measure()`, which reads the heights and anchors (via `getNoteAnchorRect()` in `utils.js`) and emits only when a value changed.

A `MutationObserver` watches `style` attributes under the root. The block move animation offsets moved blocks with a transform, which resizes nothing, so the first pass reads their old positions. The observer calls `requestMeasure()` once a changed element has no transform, so threads move when the animation ends rather than on every frame.

API:
- `subscribe(listener)` / `getSnapshot()` - wired to React via `useSyncExternalStore`. The observers only exist while there are subscribers: the first subscriber creates them and observes everything already registered, the last one disconnects them.
- `registerThread(id, blockEl, floatingEl)` - called by each `NoteThread` once mounted. Updates the refs, swaps the observed floating element, and requests a measurement.
- `unregisterThread(id)` - inverse; called on unmount.
- `requestMeasure()` - asks for a new pass when anchors may move without anything resizing or re-registering (e.g. blocks reordered).

Registering never measures directly. `requestMeasure()` re-observes the root; a new observation always reports once, so the observer runs another pass before the next paint, together with any other resizes in that frame.

`getNoteAnchorRect(noteId, blockEl)` resolves the anchor at read time, because rich-text re-renders replace the marker element:
- an inline note anchors to its in-content `mark.wp-note[data-id]` marker (its first run when the marker is split across several runs);
- the pending `new` note has no marker yet, so it anchors to the text selection it is about to wrap;
- a block-level note - or any note whose marker or selection can't be measured - falls back to the block's own `getBoundingClientRect()`;
- an anchor inside collapsed content (e.g. a closed Details) fails `checkVisibility()`, so it climbs to the closest visible block. Collapsed content still reports the box it would have when expanded, so its size can't tell it apart.

### 2. `useFloatingBoard` - the React bridge (in `hooks.js`)

Lives inside `Notes`. Holds one store instance (`useState(createBoardStore)`) and:

1. Subscribes via `useSyncExternalStore` only while floating; otherwise it passes a no-op subscribe, so the store drops its observer.
2. Requests a measurement whenever `threads` changes. `threads` is rebuilt on any block insert, removal or move, which can shift anchors without resizing the root.
3. Derives `notePositions` during render with `useMemo( () => calculateNotePositions(...) )` from `threads`, `selectedNoteId` and the snapshot. There is no state, timer or rAF: React re-renders synchronously on a store change, so a resize reaches the screen in the same paint.
4. `useCanvasRoom`: in a layout effect keyed on `isFloating + canvas + contentHeight`, writes the `contentHeight` from the same `calculateNotePositions` call as `--wp-editor-canvas-min-height` on the canvas root. The canvas margin's CSS (`getCanvasMarginCSS` in `visual-editor/canvas-margin.js`) applies it as the root's `min-height` inside its tiers, so a short post can always scroll to the lowest thread and the room goes away with the margin. The value changes at most twice per selection change (new positions, then the expanded thread's measured height), both before the next paint.
5. `useMirroredScroll`: in a layout effect keyed on `isFloating + sidebarRef + canvas`, mirrors the panel and the canvas. The floating panel is a real scroller (`overflow-y: auto`, hidden scrollbar) whose `::before` spacer gives it the canvas's scroll range, written as `--canvas-scroll-range` from a `ResizeObserver` on the canvas root, its body and the panel. A `scroll` listener on each side scrolls the other to its position, and the canvas owns the position: when it can't follow the panel, the panel snaps back. The code comments cover the details (instant scrolls, the echo guard, why the observer never sets positions).
6. `usePanelOffsets`: writes the snapshot's `frameOffset` as `--canvas-offset` and `scrollbarWidth` as `--canvas-scrollbar-width` on the panel.
7. Returns `{ notePositions, heights, registerThread, unregisterThread }` - the positions and heights flow down as props; the two register callbacks flow to each `NoteThread`.

### 3. `calculateNotePositions` - pure layout math (in `utils.js`)

Given the list of threads, the currently selected note id, the anchor rects, and the floating heights, returns `{ positions: { [noteId]: top }, contentHeight }` where `top` is the final canvas-space y-coordinate for each floating thread and `contentHeight` is the lowest measured thread's bottom plus a gap, in the same space.

Algorithm, keyed on the selected note as an **anchor**:

1. Sort the threads by measured anchor top. The sweeps below assume tops increase with index; document order satisfies that for notes anchored to their markers, but the pending `new` note anchors to the live selection and can sit above notes that precede it in the list.
2. Anchor the selected note at `anchorRect.top + THREAD_ALIGN_OFFSET` (−16). If no selected note, anchor the first thread.
3. Walk forward from the anchor: each subsequent thread starts at its own anchor's top; if it would overlap the previous thread's bottom (plus `THREAD_GAP` of 16), push it further down by `OVERLAP_MARGIN` (20).
4. Walk backward from the anchor: mirror - push upward into any overlap.
5. Convert each final offset into content-space by adding `anchorRect.top + scrollTop`.

### 4. `FloatingContainer` - the render shell

Renders a `Stack` with `top: floating.y` when in floating mode. CSS translates each thread by `--canvas-offset`, so it tracks the canvas frame; the panel's own scroll, mirrored with the canvas, tracks the canvas scroll, so per-thread `top` values stay stable while scrolling. A `top` transition eases reflows (e.g. on selection change) unless the user prefers reduced motion; a thread's first positioning starts from `top: auto` and doesn't animate.

### Why this shape

Each layer has one job, so a new anchor type or layout rule touches only one of them:

- DOM reads happen only in `measure()`, inside the `ResizeObserver` callback. It runs after layout and before paint, so reads are cheap, the result is painted in the same frame, and the browser's resize-loop detection covers any feedback between positions and sizes. Don't add rAFs or timers around it.
- The snapshot is plain data compared by value, so unrelated resizes don't re-render `Notes`.
- Observer lifetime follows subscriptions, so remounts (and StrictMode's double effects) rebuild it from the registered refs.
- `calculateNotePositions` is pure and derived during render; anything computable from props, state and the snapshot should stay out of React state.
- The scroll listeners mirror scroll positions and the range observer updates a CSS variable, never React state, so scrolling doesn't re-render.
