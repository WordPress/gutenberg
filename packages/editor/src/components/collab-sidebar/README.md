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
├── add-note-menu-item.jsx           AddNoteMenuItem - block-toolbar "Add note" trigger
├── note-indicator-toolbar.jsx       NoteAvatarIndicator - toolbar participants avatars
├── floating-container.jsx           FloatingContainer - stack wrapper that applies `top` in floating mode
│
├── hooks.js                        useNoteThreads, useNoteActions, useNoteSelection, useFloatingBoard, useEnableFloatingSidebar
├── utils.js                        focusNoteThread, getNoteExcerpt, sanitizeNoteContent, calculateNotePositions, getAvatarBorderColor
├── board-store.js                  createBoardStore - DOM measurement for the floating layout
├── constants.js                    sidebar identifier strings
├── style.scss
└── test/
    └── utils.js
```

## Component hierarchy

```
NotesSidebarContainer (index.jsx)         - gates on post type support
 └── NotesSidebar (index.jsx)             - owns sidebarRef + useNoteThreads + sidebar registration
      ├── AddNoteMenuItem                - slot fill in the block toolbar
      ├── NoteAvatarIndicator            - slot fill in the block toolbar (per-thread avatars)
      ├── PluginSidebar (all-notes)      - full sidebar
      │    └── Notes (notes.jsx)          - owns outer Stack + aria-label + useNoteActions + keyboard nav
      │         ├── AddNote              - rendered when no threads (template-locked) or selectedNote === 'new'
      │         └── NoteThread[]         - per thread
      │              └── <FloatingContainer>
      │                   ├── Note       - top-level note (own state: edit/delete/dialog)
      │                   │    └── NoteCard
      │                   │         └── NoteByline + actions slot + body children
      │                   ├── Note[]     - replies (when selected)
      │                   └── NoteCard + NoteForm - inline reply form (when selected)
      └── PluginSidebar (floating)       - floating sidebar (large viewport, unresolved notes)
           └── Notes (same)              - isFloating
```

`Notes` is reused for both sidebar surfaces. The only visual difference is driven by `isFloating` (whether to layer threads over the canvas or stack them in a panel).

## Floating board

Goal: in the floating sidebar, each unresolved note appears beside its associated block, tracks canvas scroll, and shifts up/down to avoid overlapping with neighbors - all without re-rendering threads as the canvas scrolls.

Three layers cooperate:

### 1. `board-store.js` - DOM measurement

A plain JS store created via `createBoardStore()` (one per mounted `Notes`). It is the only place that reads layout from the DOM. It holds:

- `blockRefs: Map<noteId, HTMLElement>` - each note's associated block element.
- `floatingRefs: Map<noteId, HTMLElement>` - each note's floating DOM node.
- `idByElement: WeakMap<HTMLElement, noteId>` - reverse lookup for the `ResizeObserver`.
- `rootEl` / `canvas` / `frameEl` - the block-list root (`.is-root-container`, found from the first registered block), its scroll container, and the canvas `iframe`.
- `snapshot: { heights, anchorRects, canvas, frameOffset }` - plain data for `useSyncExternalStore`. `anchorRects[id].top` is in canvas content-space (viewport top + `scrollTop`), so scrolling alone never changes it. `frameOffset` is the canvas frame's top minus the top of the threads' container (their `offsetParent`): anchors are read in the frame's viewport, threads are positioned in the container, and anything above the canvas (e.g. an editor notice or the device preview inset) separates the two.

One `ResizeObserver` watches every floating element, the root and the canvas frame. Watching the root means editing, adding or removing any block re-anchors the threads after it. Content above the canvas moves the frame and shrinks it, so watching the frame keeps `frameOffset` current; a frame that moves without resizing isn't detected. Every callback runs `measure()`, which reads the heights and each thread's anchor via `getNoteAnchorRect()` (in `utils.js`), and emits only when a value changed.

A `MutationObserver` watches `style` attributes under the root and calls `requestMeasure()`. The block move animation offsets moved blocks with a transform, which resizes nothing, so the first pass reads their old positions; this keeps the threads following the blocks until the transform is cleared.

API:
- `subscribe(listener)` / `getSnapshot()` - wired to React via `useSyncExternalStore`. The observers only exist while there are subscribers: the first subscriber creates them and observes everything already registered, the last one disconnects them.
- `registerThread(id, blockEl, floatingEl)` - called by each `NoteThread` once mounted. Updates the refs, swaps the observed floating element, and requests a measurement.
- `unregisterThread(id)` - inverse; called on unmount.
- `requestMeasure()` - asks for a new pass when anchors may move without anything resizing or re-registering (e.g. blocks reordered).

Registering never measures directly. `requestMeasure()` re-observes the root; a new observation always reports once, so the observer runs another pass before the next paint, together with any other resizes in that frame.

`getNoteAnchorRect(noteId, blockEl)` resolves the anchor at read time, because rich-text re-renders replace the marker element:
- an inline note anchors to its in-content `mark.wp-note[data-id]` marker (its first run when the marker is split across several runs);
- the pending `new` note has no marker yet, so it anchors to the text selection it is about to wrap;
- a block-level note - or any note whose marker or selection can't be measured - falls back to the block's own `getBoundingClientRect()`.

### 2. `useFloatingBoard` - the React bridge (in `hooks.js`)

Lives inside `Notes`. Holds one store instance (`useState(createBoardStore)`) and:

1. Subscribes via `useSyncExternalStore` only while floating; otherwise it passes a no-op subscribe, so the store drops its observer.
2. Requests a measurement whenever `threads` changes. `threads` is rebuilt on any block insert, removal or move, which can shift anchors without resizing the root.
3. Derives `notePositions` during render with `useMemo( () => calculateNotePositions(...) )` from `threads`, `selectedNoteId` and the snapshot. There is no state, timer or rAF: React re-renders synchronously on a store change, so a resize reaches the screen in the same paint.
4. In a layout effect keyed on `isFloating + sidebarRef + canvas`, attaches a capture-phase `scroll` listener on the canvas's `defaultView` that writes `--canvas-scroll` on the sidebar panel. (`window` capture catches scrolls on the document root, which don't bubble.) A second layout effect writes the snapshot's `frameOffset` as `--canvas-offset`.
5. Returns `{ notePositions, registerThread, unregisterThread }` - the positions flow down as props; the two register callbacks flow to each `NoteThread`.

### 3. `calculateNotePositions` - pure layout math (in `utils.js`)

Given the list of threads, the currently selected note id, the anchor rects, and the floating heights, returns `{ positions: { [noteId]: top } }` where `top` is the final canvas-space y-coordinate for each floating thread.

Algorithm, keyed on the selected note as an **anchor**:

1. Sort the threads by measured anchor top. The sweeps below assume tops increase with index; document order satisfies that for notes anchored to their markers, but the pending `new` note anchors to the live selection and can sit above notes that precede it in the list.
2. Anchor the selected note at `anchorRect.top + THREAD_ALIGN_OFFSET` (−16). If no selected note, anchor the first thread.
3. Walk forward from the anchor: each subsequent thread starts at its own anchor's top; if it would overlap the previous thread's bottom (plus `THREAD_GAP` of 16), push it further down by `OVERLAP_MARGIN` (20).
4. Walk backward from the anchor: mirror - push upward into any overlap.
5. Convert each final offset into content-space by adding `anchorRect.top + scrollTop`.

### 4. `FloatingContainer` - the render shell

Renders a `Stack` with `top: floating.y` when in floating mode. CSS translates each thread by `--canvas-offset` plus `--canvas-scroll`, so it tracks the canvas frame and its scroll, so per-thread `top` values stay stable while scrolling.

### Why this shape

Each layer has one job, so a new anchor type or layout rule touches only one of them:

- DOM reads happen only in `measure()`, inside the `ResizeObserver` callback. It runs after layout and before paint, so reads are cheap, the result is painted in the same frame, and the browser's resize-loop detection covers any feedback between positions and sizes. Don't add rAFs or timers around it.
- The snapshot is plain data compared by value, so unrelated resizes don't re-render `Notes`.
- Observer lifetime follows subscriptions, so remounts (and StrictMode's double effects) rebuild it from the registered refs.
- `calculateNotePositions` is pure and derived during render; anything computable from props, state and the snapshot should stay out of React state.
- The scroll listener updates a CSS variable rather than React state, so scrolling doesn't re-render.
