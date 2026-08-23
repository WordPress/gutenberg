/**
 * Inline markers: a format-agnostic primitive for anchoring inline ranges to
 * edit-surviving `<mark>` markers in block content.
 *
 * Positions are always derived from the in-content marker on read (never
 * stored), so a marked range survives unrelated edits elsewhere in the same
 * attribute. `findMarkerRange` is the single offset-resolution point and the
 * intended swap point for a future CRDT-backed resolver.
 *
 * Consumed by Notes (`core/note`) and Suggestions (`core/suggestion`); each
 * passes its own format type, id attribute, and annotation source so the two
 * coexist on one block without colliding.
 */

export { findMarkerRange, findMarkerText } from './find-marker-range';
export { wrapInlineMarker } from './wrap-inline-marker';
export { readInlineSelection } from './read-inline-selection';
export { readInlineCaret } from './read-inline-caret';
export { reconcileMarkerRemoval } from './reconcile-marker-removal';
export { useAnnotateRanges } from './use-annotate-ranges';
