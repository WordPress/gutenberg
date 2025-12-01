/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * Combobox control option format (matches ComboboxControl from @wordpress/components).
 */
export interface ComboboxControlOption {
	label: string;
	value: string;
	disabled?: boolean;
	[ key: string ]: any;
}

/**
 * Link value structure representing a link reference.
 *
 * Consumers can include any properties they need for display or functionality.
 * The component reads common properties like url, label, title, icon, image, etc.
 *
 * @example
 * ```tsx
 * // Simple URL link
 * { url: 'https://example.com' }
 *
 * // Link with display data
 * {
 *   url: 'https://example.com/page',
 *   label: 'Get In Touch', // Custom link text
 *   title: 'Contact Us', // Title for display
 *   image: 'https://...', // Image for preview
 *   icon: 'https://...', // Icon for preview
 * }
 * ```
 */
export interface LinkValue {
	/**
	 * The URL the link points to.
	 */
	url?: string;
	/**
	 * The label/text displayed in the link (the HTML string inside `<a>`).
	 * This is the custom, editable text for the link (e.g., "Get In Touch").
	 * Can be edited via TitleInput component.
	 */
	label?: string;
	/**
	 * The entity's actual title (e.g., Page title "Contact").
	 * This is displayed in the preview to show what entity the link points to.
	 * Distinct from label - label is the custom link text, title is the entity title.
	 */
	title?: string;
	/**
	 * Icon for preview display. Can be:
	 * - A React component
	 * - An SVG (string or ReactNode)
	 * - A URL (string)
	 */
	icon?: ComponentType< any > | ReactNode | string;
	/**
	 * Image URL for preview display.
	 */
	image?: string;
	/**
	 * Whether the link should open in a new tab.
	 */
	opensInNewTab?: boolean;
	/**
	 * Additional properties.
	 * Consumers can include any custom properties they need.
	 */
	[ key: string ]: any;
}

/**
 * Link suggestion from search results.
 */
export interface LinkSuggestion {
	id?: string | number;
	title: string;
	url: string;
	type?: string;
	kind?: string;
	[ key: string ]: any;
}

/**
 * Link setting configuration.
 */
export interface LinkSetting {
	id: string;
	title: string;
	/**
	 * Optional help text for the setting.
	 */
	help?: string;
	/**
	 * Optional custom render function for the setting.
	 * If provided, this will be used instead of the default CheckboxControl.
	 *
	 * @param setting  The setting configuration object.
	 * @param value    The current link value.
	 * @param onChange Callback to update the link value.
	 * @return React element to render for this setting.
	 */
	render?: (
		setting: LinkSetting,
		value: LinkValue | undefined,
		onChange: ( newValue: LinkValue ) => void
	) => React.ReactNode;
}

/**
 * Options for fetching link suggestions.
 * Consumers can determine query parameters based on context.
 */
export interface FetchSuggestionsOptions {
	/**
	 * Whether this is a request for initial suggestions (when no search query).
	 */
	isInitialSuggestions?: boolean;
	/**
	 * Current link value context (if any) to help determine query.
	 */
	currentValue?: LinkValue;
	/**
	 * Any additional context consumers want to pass.
	 */
	[ key: string ]: any;
}

/**
 * Function to fetch link suggestions.
 * Consumers can determine query parameters (type, subtype, etc.) based on
 * the search string and options context.
 */
export type FetchSuggestionsFunction = (
	search: string,
	options?: FetchSuggestionsOptions
) => Promise< LinkSuggestion[] >;

/**
 * Transform function to convert LinkSuggestion to ComboboxControlOption.
 */
export type TransformSuggestionFunction = (
	suggestion: LinkSuggestion
) => ComboboxControlOption;

/**
 * Props for the main LinkControlV2 component.
 */
export interface LinkControlV2Props {
	/**
	 * The committed link value (what's been saved/applied).
	 */
	value?: LinkValue;
	/**
	 * Callback when the committed value changes.
	 */
	onChange?: ( value: LinkValue ) => void;
	/**
	 * Link settings configuration.
	 */
	settings?: LinkSetting[];
	/**
	 * Search handler function that determines what happens when a search is made.
	 *
	 * The search handler is an imperative function that receives the search query and context,
	 * and returns a promise resolving to search results. This provides complete control over
	 * search behavior, including:
	 * - What kind of input to accept (searches, direct entry URLs)
	 * - How to handle input into the search box
	 * - What fetch handler to run (if any)
	 * - How to handle direct entry
	 *
	 * **Default Behavior:**
	 * If not provided, `LinkControlV2` automatically creates a default handler that:
	 * - Uses `__experimentalFetchLinkSuggestions` from block editor settings (like original LinkControl)
	 * - Requires minimum 2 characters before searching
	 * - Handles direct URL entry automatically
	 * - Shows initial suggestions by default
	 *
	 * **When to Provide a Custom Handler:**
	 * - You need to search a specific post type (e.g., Nav block "Product link" variation)
	 * - You need custom search logic or filtering
	 * - You need to disable initial suggestions
	 * - You need to customize minimum search length
	 * - You need to combine multiple search strategies
	 *
	 * **Available Utilities:**
	 * - `createDefaultSearchHandler()` - Creates handler with sensible defaults
	 * - `createTypedSearchHandler()` - Creates handler for specific post types
	 * - Mixins: `withMinLength()`, `withDirectEntry()`, `withFetch()`, `withInitialSuggestions()`
	 * - Utilities: `detectDirectEntry()`, `checkMinLength()`, `createDirectEntrySuggestion()`
	 *
	 * @example
	 * ```tsx
	 * // Default behavior (uses settings automatically - no handler needed)
	 * <LinkControlV2 value={value} onChange={onChange} />
	 *
	 * // Custom handler for product links (Nav block use case)
	 * import { createTypedSearchHandler } from '@wordpress/block-editor';
	 *
	 * const productHandler = createTypedSearchHandler(fetchSuggestions, {
	 *   type: 'product'
	 * });
	 *
	 * <LinkControlV2
	 *   value={value}
	 *   onChange={onChange}
	 *   searchHandler={productHandler}
	 * />
	 *
	 * // Custom handler with disabled initial suggestions
	 * import { createDefaultSearchHandler } from '@wordpress/block-editor';
	 *
	 * const handler = createDefaultSearchHandler(undefined, {
	 *   showInitialSuggestions: false
	 * });
	 *
	 * <LinkControlV2
	 *   value={value}
	 *   onChange={onChange}
	 *   searchHandler={handler}
	 * />
	 *
	 * // Fully custom handler using mixins
	 * import {
	 *   compose,
	 *   withMinLength,
	 *   withDirectEntry,
	 *   withFetch,
	 * } from '@wordpress/block-editor';
	 *
	 * const customHandler = compose(
	 *   withMinLength(3), // Require 3 characters
	 *   withDirectEntry(),
	 *   withFetch(myFetchFunction, (searchValue, context) => ({
	 *     type: 'post',
	 *     subtype: 'page',
	 *     isInitialSuggestions: context.isInitial,
	 *   }))
	 * )(() => ({ suggestions: [] }));
	 *
	 * <LinkControlV2
	 *   value={value}
	 *   onChange={onChange}
	 *   searchHandler={customHandler}
	 * />
	 *
	 * // Fully custom handler (complete control)
	 * <LinkControlV2
	 *   value={value}
	 *   onChange={onChange}
	 *   searchHandler={async (searchValue, context) => {
	 *     // Your custom logic here
	 *     if (context.isInitial) {
	 *       return { suggestions: [] }; // No initial suggestions
	 *     }
	 *     const results = await myCustomSearch(searchValue);
	 *     return { suggestions: results };
	 *   }}
	 * />
	 * ```
	 */
	searchHandler?: import('./search-strategy').HandleSearch;
	/**
	 * Custom components to replace defaults or disable them.
	 *
	 * Mutually exclusive with `children`. Use this to replace individual
	 * components while keeping the default composition logic (editing mode
	 * handling, conditional rendering, etc.), or pass `false` to disable
	 * a component entirely.
	 *
	 * If you need full control over composition, use `children` instead.
	 *
	 * @example
	 * ```tsx
	 * // Replace a component
	 * <LinkControlV2
	 *   components={{
	 *     SearchInput: MyCustomSearchInput,
	 *   }}
	 * />
	 *
	 * // Disable a component
	 * <LinkControlV2
	 *   components={{
	 *     TitleInput: false,  // Don't show title input
	 *     Settings: false,    // Don't show settings
	 *   }}
	 * />
	 * ```
	 */
	components?: {
		SearchInput?: ComponentType< any > | false;
		Preview?: ComponentType< any > | false;
		Settings?: ComponentType< any > | false;
		TitleInput?: ComponentType< any > | false;
		Actions?: ComponentType< any > | false;
	};
	/**
	 * Children to render inside the component.
	 *
	 * Mutually exclusive with `components`. Use this for full control over
	 * composition. You'll need to handle display logic yourself (e.g., when
	 * to show SearchInput vs Preview), but you can access state via
	 * `useLinkControlV2()` hook.
	 *
	 * If you just want to replace individual components, use `components` instead.
	 */
	children?: ReactNode;
}

/**
 * Context value for LinkControlV2.
 */
export interface LinkControlV2ContextValue {
	// Committed value (from value prop - what's been saved)
	value: LinkValue | undefined;
	// Uncommitted value (what's being edited)
	uncommittedValue: LinkValue | undefined;
	// Set uncommitted value
	setUncommittedValue: ( value: LinkValue | undefined ) => void;
	// Commit the uncommitted value (calls onChange and syncs uncommittedValue)
	commitValue: ( value?: LinkValue | undefined ) => void;
	// Revert to committed value (from value prop)
	revertValue: () => void;
	// Whether in editing mode
	isEditing: boolean;
	setIsEditing: ( value: boolean ) => void;
	// Settings configuration
	settings: LinkSetting[];
	// Search handler function
	searchHandler: import('./search-strategy').HandleSearch;
	// Instance ID for unique identifiers
	instanceId: string;
}
