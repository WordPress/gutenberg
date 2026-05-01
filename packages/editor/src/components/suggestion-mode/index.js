// Side-effect import: registers the inline RichText format types used to
// render proposed adds and deletes inside the editor canvas. Phase A of
// #77867; consumers of those formats land in subsequent phases.
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
export {
	useSuggestionsProvider,
	operationsFromOverlay,
	applyOperations,
	hasAttributeConflict,
	parseSuggestionPayload,
	payloadByteLength,
	PAYLOAD_MAX_BYTES,
	SCHEMA_VERSION,
} from './provider';
export { default as SuggestionDiff, wordDiff } from './suggestion-diff';
export {
	default as SuggestionSummary,
	summarizeOperations,
} from './suggestion-summary';
