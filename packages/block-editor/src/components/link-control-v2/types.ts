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
	 */
	label?: string;
	/**
	 * Title for display (used if label is not provided).
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
	 * Function to fetch link suggestions.
	 * Consumers can determine query parameters (type, subtype, etc.) based on
	 * the search string and options context passed to this function.
	 */
	fetchSuggestions?: FetchSuggestionsFunction;
	/**
	 * Whether to show initial suggestions on mount.
	 */
	showInitialSuggestions?: boolean;
	/**
	 * Custom components to replace defaults.
	 *
	 * Mutually exclusive with `children`. Use this to replace individual
	 * components while keeping the default composition logic (editing mode
	 * handling, conditional rendering, etc.).
	 *
	 * If you need full control over composition, use `children` instead.
	 */
	components?: {
		SearchInput?: ComponentType< any >;
		Preview?: ComponentType< any >;
		SettingsDrawer?: ComponentType< any >;
		TitleInput?: ComponentType< any >;
		Actions?: ComponentType< any >;
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
	// Committed value (what's been saved)
	committedValue: LinkValue | undefined;
	// Uncommitted value (what's being edited)
	uncommittedValue: LinkValue | undefined;
	// Set uncommitted value
	setUncommittedValue: ( value: LinkValue | undefined ) => void;
	// Commit the uncommitted value
	commitValue: () => void;
	// Revert to committed value
	revertValue: () => void;
	// Whether in editing mode
	isEditing: boolean;
	setIsEditing: ( value: boolean ) => void;
	// Settings configuration
	settings: LinkSetting[];
	// Fetch suggestions function
	fetchSuggestions: FetchSuggestionsFunction | undefined;
	// Whether to show initial suggestions
	showInitialSuggestions: boolean;
	// Instance ID for unique identifiers
	instanceId: string;
}

