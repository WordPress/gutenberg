# Notes Sidebar

The Notes sidebar (a.k.a. collab sidebar) lets users attach threaded notes to individual blocks. It renders in two modes:

- **All notes** - a full sidebar (opened from the editor's More menu) listing every note thread on the current post.
- **Floating notes** - on larger viewports, unresolved notes also float next to their associated blocks in the canvas, positioned to track scroll and avoid overlap.

Notes are stored as WordPress comments (`type: 'note'`) attached to the post. A block references its thread via `metadata.noteId` on block attributes. Each thread has a top-level note plus replies; threads can be resolved (stored as status `approved`) or reopened.

## File structure

```
collab-sidebar/
├── README.md                       this file
├── index.js                        NotesSidebarContainer → NotesSidebar (entry, toolbar slot fills)
├── notes.js                        Notes - coordinator (outer Stack, actions, keyboard nav)
├── note-thread.js                  NoteThread - per-thread (selection, floating registration, reply form)
├── note.js                         Note - per-card state (edit/delete mode, menu, dialog)
├── note-card.js                    NoteCard - presentational shell (byline + actions slot + children)
├── note-byline.js                  NoteByline - avatar + name + relative date
├── note-form.js                    NoteForm - autosizing textarea + submit/cancel
├── add-note.js                     AddNote - new-note surface (floating + template-locked cases)
├── add-note-menu-item.js           AddNoteMenuItem - block-toolbar "Add note" trigger
├── note-indicator-toolbar.js       NoteAvatarIndicator - toolbar participants avatars
├── floating-container.js           FloatingContainer - stack wrapper that applies `top` in floating mode
│
├── hooks.js                        useNoteThreads, useNoteActions, useFloatingBoard, useEnableFloatingSidebar
├── utils.js                        focusNoteThread, getNoteExcerpt, sanitizeNoteContent, calculateNotePositions, getAvatarBorderColor
├── board-store.js                  createBoardStore - ResizeObserver + ref registry for floating layout
├── constants.js                    sidebar identifier strings
├── style.scss
└── test/
    └── utils.js
```

## Component hierarchy

```
NotesSidebarContainer (index.js)         - gates on post type support
 └── NotesSidebar (index.js)             - owns sidebarRef + useNoteThreads + sidebar registration
      ├── AddNoteMenuItem                - slot fill in the block toolbar
      ├── NoteAvatarIndicator            - slot fill in the block toolbar (per-thread avatars)
      ├── PluginSidebar (all-notes)      - full sidebar
      │    └── Notes (notes.js)          - owns outer Stack + aria-label + useNoteActions + keyboard nav
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

### 1. `board-store.js` - imperative DOM registry

A plain JS module returning a store created via `createBoardStore()` (one per mounted `Notes`). Holds:

- `blockRefs: Map<noteId, HTMLElement>` - each note's associated block element.
- `floatingRefs: Map<noteId, HTMLElement>` - each note's floating DOM node.
- `idByElement: WeakMap<HTMLElement, noteId>` - reverse lookup for the `ResizeObserver`.
- `heights: { [noteId]: number }` - observed heights of floating elements.
- `snapshot: { ... }` - frozen shallow copy of `heights` (for `useSyncExternalStore`).

A single shared `ResizeObserver` watches every registered floating element; when a floating note changes height, it updates `heights`, snapshots, and calls every `listener` in the store's `Set`.

API:
- `subscribe(listener)` / `getSnapshot()` - wired to React via `useSyncExternalStore`. Disconnects the observer when the last subscriber leaves.
- `registerThread(id, blockEl, floatingEl)` - called by each `NoteThread` once mounted. Adds the block ref, swaps the floating ref (unobserving the previous one), starts observing the new one, emits.
- `unregisterThread(id)` - inverse; called on unmount.
- `getBlockRects()` - returns a batched snapshot of block `getBoundingClientRect()` values. Batches reads so subsequent CSS writes don't trigger layout thrash.
- `getFirstBlockElement()` - the first registered block, used to locate the canvas scroll container.

The store owns DOM references directly, not through React - floating note height changes must update layout without re-rendering the thread list.

### 2. `useFloatingBoard` - the React bridge (in `hooks.js`)

Lives inside `Notes`. Holds one store instance (`useState(createBoardStore)`) and:

1. Subscribes to `heights` via `useSyncExternalStore(store.subscribe, store.getSnapshot)`.
2. In a `useEffect` keyed on `threads + heights + selectedNoteId + isFloating + sidebarRef`:
   - Resolves the canvas scroll container by climbing from the first registered block to `.is-root-container` and calling `getScrollContainer()` on it.
   - Schedules a single `requestAnimationFrame` that calls `calculateNotePositions({ threads, selectedNoteId, blockRects: store.getBlockRects(), heights, scrollTop })` (pure function in `utils.js`) and stores the result in React state (`notePositions`).
   - Attaches a capture-phase `scroll` listener on the canvas's `defaultView` that writes a CSS variable `--canvas-scroll` to the sidebar panel. (`window` capture catches scrolls on the document root, which don't bubble.)
3. Returns `{ notePositions, registerThread, unregisterThread }` - the positions flow down as props; the two register callbacks flow to each `NoteThread`.

### 3. `calculateNotePositions` - pure layout math (in `utils.js`)

Given the list of threads, the currently selected note id, the block rects, the floating heights, and the canvas scroll offset, returns `{ positions: { [noteId]: top } }` where `top` is the final canvas-space y-coordinate for each floating thread.

Algorithm, keyed on the selected note as an **anchor**:

1. Anchor the selected note at `blockRect.top + THREAD_ALIGN_OFFSET` (−16). If no selected note, anchor the first thread.
2. Walk forward from the anchor: each subsequent thread starts at its block's top; if it would overlap the previous thread's bottom (plus `THREAD_GAP` of 16), push it further down by `OVERLAP_MARGIN` (20).
3. Walk backward from the anchor: mirror - push upward into any overlap.
4. Convert each final offset into content-space by adding `blockRect.top + scrollTop`.

### 4. `FloatingContainer` - the render shell

Renders a `Stack` with `top: floating.y` when in floating mode. CSS uses the `--canvas-scroll` custom property to translate the whole panel in sync with the canvas, so per-thread `top` values stay stable while scrolling.

### Why this shape

- `ResizeObserver` is canonical for height changes that must drive layout without polling.
- `useSyncExternalStore` is the right React 18 primitive for "external mutable source with snapshot" - gives concurrent-mode-safe subscriptions without a provider.
- The scroll listener updates a CSS variable rather than React state, so scrolling doesn't re-render. Per-note `top` only recomputes when threads, heights, selection, or structural inputs change.
- Batching `getBoundingClientRect` reads inside the `rAF` and separating them from style writes avoids forced layout.
