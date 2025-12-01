/**
 * Types
 */
export type { HandleSearch, SearchContext, SearchResult } from './types';

/**
 * Utilities
 */
export {
	detectDirectEntry,
	checkMinLength,
	createDirectEntrySuggestion,
	createFetchHandler,
} from './utilities';

/**
 * Mixins
 */
export {
	withMinLength,
	withDirectEntry,
	withFetch,
	withInitialSuggestions,
} from './mixins';

/**
 * Compose utility (re-exported from @wordpress/compose)
 */
export { compose } from '@wordpress/compose';

/**
 * Default handler
 */
export { createDefaultSearchHandler } from './default';
export type { DefaultSearchHandlerOptions } from './default';

/**
 * Typed handler (for post type-specific searches)
 */
export { createTypedSearchHandler } from './typed';
export type { TypedSearchHandlerConfig } from './typed';
