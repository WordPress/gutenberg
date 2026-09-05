export { isSuggestionModeEnabled, useCanSuggest } from './gate';
export {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
	overlayReducer,
} from './overlay-context';
export {
	default as withSuggestionOverlay,
	registerSuggestionOverlayFilter,
} from './with-suggestion-overlay';
export { MoveGhostsProvider } from './use-move-ghosts';
export { default as SuggestionAutoSave } from './auto-save';
export { default as SuggestionStoreInterceptor } from './store-interceptor';
export { default as SuggestionUndoGuard } from './suggestion-undo-guard';
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
export { wordDiff } from './word-diff';
export {
	default as SuggestionSummary,
	summarizeOperations,
} from './suggestion-summary';
