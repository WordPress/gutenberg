/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { UnforwardedLinkControlV2 } from './component';
import { LinkControlV2Context } from './context';
import { SearchInput } from './search-input';
import { Preview } from './preview';
import { Settings } from './settings';
import { TitleInput } from './title-input';
import { Actions } from './actions';

/**
 * LinkControlV2 is a compound component that provides a flexible API
 * for managing link values with opinionated defaults.
 *
 * By default, it handles committed/uncommitted values internally, but
 * consumers can access and control state via the `useLinkControlV2` hook.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <LinkControlV2
 *   value={linkValue}
 *   onChange={setLinkValue}
 * />
 *
 * // Custom composition
 * <LinkControlV2 value={linkValue} onChange={setLinkValue}>
 *   <LinkControlV2.SearchInput />
 *   <LinkControlV2.Preview />
 * </LinkControlV2>
 *
 * // Replace default components
 * <LinkControlV2
 *   value={linkValue}
 *   onChange={setLinkValue}
 *   components={{
 *     SearchInput: MyCustomSearchInput
 *   }}
 * />
 * ```
 */
export const __experimentalLinkControlV2 = Object.assign(
	UnforwardedLinkControlV2,
	{
		/**
		 * Context for LinkControlV2.
		 *
		 * Can be used to access context outside of component tree if needed.
		 */
		Context: Object.assign( LinkControlV2Context, {
			displayName: 'LinkControlV2.Context',
		} ),
		/**
		 * SearchInput subcomponent.
		 *
		 * Uses ValidatedComboboxControl for entity search functionality.
		 */
		SearchInput: Object.assign( SearchInput, {
			displayName: 'LinkControlV2.SearchInput',
		} ),
		/**
		 * Preview subcomponent.
		 *
		 * Displays the committed link value with edit/unlink actions.
		 */
		Preview: Object.assign( Preview, {
			displayName: 'LinkControlV2.Preview',
		} ),
		/**
		 * Settings subcomponent.
		 *
		 * Collapsible drawer for link settings.
		 */
		Settings: Object.assign( Settings, {
			displayName: 'LinkControlV2.Settings',
		} ),
		/**
		 * TitleInput subcomponent.
		 *
		 * Input for editing the link label/title text (the text displayed in the link).
		 */
		TitleInput: Object.assign( TitleInput, {
			displayName: 'LinkControlV2.TitleInput',
		} ),
		/**
		 * Actions subcomponent.
		 *
		 * Provides Apply and Cancel buttons.
		 */
		Actions: Object.assign( Actions, {
			displayName: 'LinkControlV2.Actions',
		} ),
	}
);

// Export hook for consumers
export { useLinkControlV2 } from './hook';

// Export types
export type {
	LinkValue,
	LinkSuggestion,
	LinkSetting,
	FetchSuggestionsOptions,
	FetchSuggestionsFunction,
	LinkControlV2Props,
} from './types';

// Export search strategy utilities
export {
	// Types
	type HandleSearch,
	type SearchContext,
	type SearchResult,
	// Utilities
	detectDirectEntry,
	checkMinLength,
	createDirectEntrySuggestion,
	createFetchHandler,
	// Mixins
	withMinLength,
	withDirectEntry,
	withFetch,
	compose,
	// Default handler
	createDefaultSearchHandler,
	// Typed handler (for post type-specific searches)
	createTypedSearchHandler,
} from './search-strategy';
export type {
	TypedSearchHandlerConfig,
	DefaultSearchHandlerOptions,
} from './search-strategy';
