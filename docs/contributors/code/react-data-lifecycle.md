# React, data, runtime lifecycle, and performance

Use this reference for hooks, `@wordpress/data`, `core-data`, preferences,
asynchronous requests, controlled components, and performance-sensitive code.

## State and selectors

- Read render-driving store data with registry-aware `useSelect`. Retrieve
  selector functions without a render subscription only for event-time reads.
- Include changing callback inputs in React/data hook dependency arrays. Return
  equal, stable selector values for unchanged state to avoid stale data and
  needless rendering.
- Use authoritative resolution metadata for the exact selector arguments.
  Distinguish unresolved, resolved-empty, populated, and failed states.
- Base updates on current state with pure updater functions. Use
  `registry.batch` when synchronous store updates must become observable as one
  final state.
- Never mutate Redux-backed state or block attribute objects/arrays directly.
  Respect explicit exceptions such as the Interactivity API's mutable reactive
  state contract.
- Use the owning API's stable unique identity when reconciling independently
  managed items.

## Boundaries and persistence

- Preserve the receiving contract's distinctions among missing, empty, `false`,
  `null`, and `undefined`. Normalize runtime input at the boundary rather than
  relying on truthiness.
- Edit and save entities through `core-data`; serialize block content through
  `post_content`; persist cross-package preferences in the preferences store.
  Avoid competing writable copies.
- Keep preference defaults separate from stored overrides. An override exists
  whenever its value is not `undefined`, including explicit `false` or `null`.
- Mark non-serialized block attributes with `role: 'local'`. Replace or revoke
  upload-preview blob URLs instead of treating them as durable content.
- Mount the established unsaved-changes warning in editor surfaces that can
  lose dirty entity records.
- New stateful `@wordpress/ui` components should support controlled and
  uncontrolled use consistently: `x`, `defaultX`, and `onXChange`, with the
  controlled value taking precedence.

## Async lifecycle

- Prevent a stale request from replacing current data. Key resolutions to the
  active arguments and use `AbortController` when the request itself must be
  canceled; handle `AbortError`.
- Show loading only before resolution and empty UI only after it. On save
  failure, keep recoverable UI open and show the recorded error.
- Follow pending, queued, and debounced work through unmount, navigation,
  closing, retries, and cleanup. Cleanup must neither drop an intended edit nor
  publish unrelated staged edits.
- Attach DOM listeners to the owning element's `ownerDocument`/`defaultView`,
  remove the corresponding listener during cleanup, and use `useRefEffect` when
  the attachment follows a changing element.
- Follow the Rules of Hooks: stable unconditional ordering, correct
  dependencies, and no hook calls from events or conditional branches.

## Performance checks

- For `core-data` fetching, pass limiting query arguments to
  `getEntityRecords`, reuse cached responses, and check resolution with exactly
  the same arguments.
- Initialize Interactivity API derived hydration state on the server so initial
  HTML matches client state.
- Evaluate editor performance against the base branch with the same environment
  and repeated suites; compare stable median metrics rather than one run.
- For production JS, CSS, metadata, or build changes, inspect compressed-size
  effects and preserve selective loading of unrelated packages.
