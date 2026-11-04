/**
 * Inline suggestions: the marker formats (one per kind: `core/suggestion-add`,
 * `-del` and `-format`) and their decoration, built on the shared
 * inline-markers primitive. A suggested inline change lives
 * as marked text in block content (Option B) and is type-aware:
 *
 * - `del` (deletion): existing text proposed for removal. Front-end keeps the
 *   text and strips the wrapper until the suggestion is accepted.
 * - `add` (addition): proposed new text. Front-end strips the wrapper *and* the
 *   text until the suggestion is accepted.
 *
 * - `format`: existing text whose formatting is proposed to change.
 *
 * A replacement (typing over a selection) is one note whose id is carried by an
 * `add` run and the `del` run right after it. Markers of different kinds nest
 * over the same characters (a deletion inside someone else's addition) in one
 * canonical order: add outermost, then format, then del.
 *
 * The render-time strip (keep del-text, drop add-text, remove all wrappers) is
 * handled server-side by `gutenberg_strip_inline_suggestion_markers`
 * (`lib/compat/wordpress-7.1/block-suggestions.php`).
 */

export {
	SUGGESTION_A11Y_FORMAT_NAME,
	SUGGESTION_MARKER_KINDS,
	SUGGESTION_KIND_ORDER,
	SUGGESTION_FORMAT_NAMES,
	SUGGESTION_CLASSES,
	SUGGESTION_CLASS_PROBE,
	SUGGESTION_ANNOTATION_SOURCE,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_TYPE_DELETION,
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_FORMAT,
	SUGGESTION_TYPE_REPLACEMENT,
	suggestionMarkerFormats,
	suggestionA11yFormat,
	addSuggestionRoleFormats,
	registerSuggestionFormat,
	unregisterSuggestionFormats,
	isSuggestionFormat,
	suggestionKindOf,
	suggestionFormatNameFor,
	suggestionMarkersAt,
	suggestionMarkersIn,
	canonicalizeSuggestionStack,
	findSuggestionRange,
	findSuggestionText,
	getSuggestionMarkerSelector,
} from './format';
export type { SuggestionMarkerKind } from './format';
export { useAnnotateSuggestions } from './use-annotate-suggestions';
export {
	acceptInlineDeletion,
	rejectInlineDeletion,
	acceptInlineAddition,
	rejectInlineAddition,
	acceptInlineReplacement,
	rejectInlineReplacement,
	acceptInlineFormat,
	rejectInlineFormat,
	insertInlineAddition,
	removeInlineAdditionRange,
	reviseOwnAddition,
	deleteAcrossOwnMarkers,
	findAdditionRange,
	growInlineAddition,
	buildSuggestionMarkerAttributes,
	formatsRangeHasSuggestion,
	valueRangeHasSuggestion,
	formatsAdditionRunToExtend,
	valueAdditionRunToExtend,
	suggestionMarkerRuns,
	formatOriginalAligns,
	wrapSuggestionMarker,
} from './operations';
export { classifyOverlap } from './overlap';
export type {
	OverlapBlocking,
	OverlapGesture,
	OverlapReason,
	OverlapVerdict,
} from './overlap';
export {
	resolveInlineSuggestion,
	rebaseFormatOriginal,
	suggestionsEmptiedBy,
} from './resolution';
export type { InlineSuggestionType, ResolutionEffect } from './resolution';
export { suggestionRelations } from './relations';
export type { RelatedSuggestion, SuggestionRelations } from './relations';
export {
	normalizeSuggestionMarkers,
	guardMarkerIntegrity,
} from './marker-integrity';
export { computeDeleteRange } from './delete-range';
export {
	analyzeTextEdit,
	planEditMarkers,
	applyEditPlan,
} from './reconcile-edit';
export type { EditRefusal } from './reconcile-edit';
export {
	analyzeFormatEdit,
	planFormatMarkers,
	applyFormatPlan,
} from './reconcile-format';
export {
	hasSuggestionMarkers,
	stripSuggestionMarkers,
	stripSuggestionMarkersFromAttributes,
	settleInsertedSuggestionMarkers,
} from './strip-markers';
