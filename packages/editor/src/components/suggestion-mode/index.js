// Side-effect import: registers the inline RichText format types
// (`gutenberg/suggested-deletion`, `gutenberg/suggested-addition`) consumed
// by `with-suggestion-overlay.js` to render proposed adds and deletes inside
// the editor canvas. See #77867.
import './inline-formats';

export {
	SUGGESTED_DELETION_FORMAT,
	SUGGESTED_ADDITION_FORMAT,
	registerSuggestionFormats,
} from './inline-formats';
export {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
	overlayReducer,
} from './overlay-context';
export {
	default as withSuggestionOverlay,
	registerSuggestionOverlayFilter,
} from './with-suggestion-overlay';
export { default as SuggestionAutoSave } from './auto-save';
export { default as SuggestionStoreInterceptor } from './store-interceptor';
export { default as SuggestionDeletionKeyboard } from './suggestion-deletion-keyboard';
export { default as SuggestionAdditionKeyboard } from './suggestion-addition-keyboard';
export {
	default as SuggestionAnnotations,
	suggestionAnnotations,
	useAnnotateSuggestionThreads,
} from './annotate-suggestions';
export {
	default as SuggestionAuthorColors,
	buildSuggestionAuthorColorCss,
} from './suggestion-author-colors';
export {
	useSuggestionsProvider,
	operationsFromOverlay,
	applyOperations,
	hasAttributeConflict,
	parseSuggestionPayload,
	payloadByteLength,
	findStructuralOp,
	clearSuggestionMarkerAttributes,
	PAYLOAD_MAX_BYTES,
	SCHEMA_VERSION,
} from './provider';
export { default as SuggestionDiff, wordDiff } from './suggestion-diff';
export {
	default as SuggestionSummary,
	summarizeOperations,
} from './suggestion-summary';
