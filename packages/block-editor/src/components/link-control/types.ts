import type { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import type { Icon } from '@wordpress/icons';
import type { Badge } from '@wordpress/ui';
import type {
	SuggestionItemProps,
	URLInputSuggestionsProps,
} from '../url-input/types';

/**
 * Custom settings values associated with a link.
 */
export type LinkControlSettingsValue = { [ setting: string ]: unknown };

/**
 * Properties associated with a link control value, composed as a union of the
 * default properties and any custom settings values.
 */
export interface LinkControlValue extends LinkControlSettingsValue {
	/**
	 * Link URL.
	 */
	url?: string | null;
	/**
	 * Link title.
	 */
	title?: string;
	/**
	 * Whether link should open in a new browser tab. This value is only
	 * assigned if not providing a custom `settings` prop.
	 */
	opensInNewTab?: boolean;
	id?: string | number;
	type?: string;
	kind?: string;
	/**
	 * The title of the linked entity, shown in the preview over `title`.
	 */
	entityTitle?: string;
	/**
	 * An image shown in the preview in place of the link icon.
	 */
	image?: string;
	/**
	 * Badges shown in the preview under the URL.
	 */
	badges?: LinkPreviewBadge[];
}

/**
 * A badge shown in the link preview.
 */
export interface LinkPreviewBadge {
	label: string;
	intent?: ComponentProps< typeof Badge >[ 'intent' ];
}

/**
 * Value change handler of `LinkControl`.
 */
export type LinkControlOnChangeProp = ( nextValue: LinkControlValue ) => void;

/**
 * Custom settings values associated with a link.
 */
export interface LinkControlSetting {
	/**
	 * Identifier to use as property for setting value.
	 */
	id: string;
	/**
	 * Human-readable label to show in user interface.
	 */
	title?: string;
	/**
	 * Help text shown under the setting's checkbox.
	 */
	help?: ReactNode;
	/**
	 * Renders the setting in place of the default checkbox.
	 */
	render?: (
		setting: LinkControlSetting,
		value: LinkControlValue | undefined,
		onChange: ( nextValue: LinkControlValue ) => void
	) => ReactNode;
}

/**
 * Properties associated with a search suggestion used within the LinkControl.
 */
export interface LinkControlSuggestion extends LinkControlSettingsValue {
	/**
	 * Identifier to use to uniquely identify the suggestion.
	 */
	id?: string | number;
	/**
	 * Identifies the type of the suggestion (eg: `post`, `page`, `url`...etc)
	 */
	type?: string;
	/**
	 * Human-readable label to show in user interface.
	 */
	title?: string;
	/**
	 * A URL for the suggestion.
	 */
	url?: string;
	kind?: string;
	/**
	 * The label shown beside the title, in place of `type`.
	 */
	typeLabel?: string;
	/**
	 * The icon shown before the title.
	 */
	icon?: ComponentProps< typeof Icon >[ 'icon' ];
	isFrontPage?: boolean;
	isBlogHome?: boolean;
}

/**
 * Creates a suggestion, directly or through a Promise, from the search input
 * value.
 */
export type LinkControlCreateSuggestionProp = (
	title: string
) => LinkControlSuggestion | Promise< LinkControlSuggestion >;

/**
 * Query parameters passed along to the link suggestions fetcher.
 */
export interface LinkSuggestionsQuery {
	type?: 'attachment' | 'post' | 'term' | 'post-format';
	subtype?: string;
	isInitialSuggestions?: boolean;
	[ param: string ]: unknown;
}

/**
 * The second argument of `transformSuggestions`.
 */
export interface TransformSuggestionsOptions {
	isInitialSuggestions: boolean;
	searchTerm: string;
}

/**
 * Changes the search suggestions before they are shown.
 */
export type TransformSuggestions = (
	suggestions: LinkControlSuggestion[],
	options: TransformSuggestionsOptions
) => LinkControlSuggestion[] | Promise< LinkControlSuggestion[] >;

/**
 * Fetches the link suggestions for a search term, as the
 * `__experimentalFetchLinkSuggestions` editor setting does.
 */
export type FetchLinkSuggestions = (
	search: string,
	query: LinkSuggestionsQuery
) => Promise< LinkControlSuggestion[] >;

/**
 * Fetches the rich preview data of a URL, as the
 * `__experimentalFetchRichUrlData` editor setting does.
 */
export type FetchRichUrlData = (
	url: string,
	options: { signal: AbortSignal }
) => Promise< RichUrlData | null >;

/**
 * Rich preview data of a URL.
 */
export interface RichUrlData {
	title?: string;
	icon?: string;
	[ key: string ]: unknown;
}

/**
 * Text of the button that creates a suggestion, or a function returning it
 * for the search term.
 */
export type CreateSuggestionButtonText =
	ReactNode | ( ( searchTerm: string ) => ReactNode );

/**
 * The URL validity shown on the search input.
 */
export type LinkControlValidity =
	{ type: 'invalid'; message: string } | { type: 'valid' };

/**
 * Props of `LinkControl`.
 */
export interface LinkControlProps {
	/**
	 * An array of settings objects. Each object will used to render a
	 * `ToggleControl` for that setting.
	 */
	settings?: LinkControlSetting[];
	/**
	 * If passed as either `true` or `false`, controls the internal editing
	 * state of the component to show or not show the URL input field.
	 */
	forceIsEditingLink?: boolean;
	/**
	 * Placeholder text for the search input.
	 */
	searchInputPlaceholder?: string;
	/**
	 * Current link value.
	 */
	value?: LinkControlValue;
	/**
	 * Value change handler, called with the updated value if the user selects
	 * a new link or updates settings.
	 */
	onChange?: LinkControlOnChangeProp;
	/**
	 * Callback fired when the search input value changes. Use this for
	 * observation only (e.g., to track search state).
	 */
	onInputChange?: ( value: string ) => void;
	/**
	 * Callback invoked when the link is removed.
	 */
	onRemove?: () => void;
	/**
	 * Callback invoked when editing is cancelled.
	 */
	onCancel?: () => void;
	/**
	 * Initial value for the search input (uncontrolled).
	 */
	inputValue?: string;
	/**
	 * Whether to allow turning a URL-like search query directly into a link.
	 */
	noDirectEntry?: boolean;
	/**
	 * Whether to present suggestions when typing the URL.
	 */
	showSuggestions?: boolean;
	/**
	 * Whether to present initial suggestions immediately.
	 */
	showInitialSuggestions?: boolean;
	/**
	 * Whether to allow creation of link value from suggestion.
	 */
	withCreateSuggestion?: boolean;
	/**
	 * Creates a suggestion from the search input value.
	 */
	createSuggestion?: LinkControlCreateSuggestionProp;
	/**
	 * Query parameters to pass along to
	 * wp.blockEditor.__experimentalFetchLinkSuggestions.
	 */
	suggestionsQuery?: LinkSuggestionsQuery;
	/**
	 * Changes the search suggestions before they are shown. Returns the
	 * suggestions to show or a Promise of them.
	 */
	transformSuggestions?: TransformSuggestions;
	/**
	 * Whether to add a fallback suggestion which treats the search query as
	 * a URL.
	 */
	noURLSuggestion?: boolean;
	/**
	 * The text to use in the button that calls createSuggestion.
	 */
	createSuggestionButtonText?: CreateSuggestionButtonText;
	/**
	 * Whether to fetch and show a rich preview of the link.
	 */
	hasRichPreviews?: boolean;
	/**
	 * Whether to add a text field to the UI to update the value.title.
	 */
	hasTextControl?: boolean;
	/**
	 * Optional controls to be rendered at the bottom of the component.
	 */
	renderControlBottom?: ( () => ReactNode ) | null;
	/**
	 * Whether to handle entity links (links with ID). When true and a link
	 * has an ID, the input will be disabled and show an unlink button.
	 */
	handleEntities?: boolean;
}

/**
 * Props of the suffix control of the `LinkControl` search input.
 */
export interface SearchSuffixControlProps {
	/**
	 * Whether the link is bound to an entity.
	 */
	isEntity: boolean;
	/**
	 * Whether to show action buttons.
	 */
	showActions: boolean;
	/**
	 * Whether the submit button should be disabled.
	 */
	isDisabled: boolean | undefined;
	/**
	 * Callback when unlink button is clicked.
	 */
	onUnlink: () => void;
	/**
	 * Callback when submit button is clicked.
	 */
	onSubmit: () => void;
	/**
	 * ID of the help text element for accessibility.
	 */
	helpTextId: string | null;
}

/**
 * Props of `LinkControlSearchResults`.
 */
export interface LinkControlSearchResultsProps extends URLInputSuggestionsProps {
	withCreateSuggestion?: boolean;
	createSuggestionButtonText?: CreateSuggestionButtonText;
	suggestionsQuery?: LinkSuggestionsQuery;
}

/**
 * Props of `LinkControlSearchInput`.
 */
export interface LinkControlSearchInputProps {
	/**
	 * Passed verbatim to URLInput.
	 */
	value?: string;
	/**
	 * If passed, children are rendered after the input.
	 */
	children?: ReactNode;
	/**
	 * The same as `value` in LinkControl.
	 */
	currentLink?: LinkControlValue;
	/**
	 * Passed verbatim to URLInput.
	 */
	className?: string | null;
	/**
	 * Passed verbatim to URLInput.
	 */
	placeholder?: string | null;
	withCreateSuggestion?: boolean;
	/**
	 * Called when the "Create" suggestion is selected.
	 */
	onCreateSuggestion?: (
		title?: string
	) => LinkControlSuggestion | void | Promise< LinkControlSuggestion | void >;
	/**
	 * Value change handler passed to the underlying `<URLInput />`.
	 */
	onChange?: ( value: string ) => void;
	/**
	 * Suggestion selection handler, called when the user chooses one of the
	 * suggested items.
	 */
	onSelect?: (
		value: LinkControlSuggestion,
		suggestion?: LinkControlSuggestion
	) => void;
	showSuggestions?: boolean;
	/**
	 * Function used to render search suggestions.
	 */
	renderSuggestions?: ( props: LinkControlSearchResultsProps ) => ReactNode;
	/**
	 * Custom search handler for suggestions.
	 */
	fetchSuggestions?: FetchLinkSuggestionsHandler | null;
	/**
	 * The opposite of `noDirectEntry` from LinkControl.
	 */
	allowDirectEntry?: boolean;
	showInitialSuggestions?: boolean;
	suggestionsQuery?: LinkSuggestionsQuery;
	transformSuggestions?: TransformSuggestions | null;
	createSuggestionButtonText?: CreateSuggestionButtonText;
	hideLabelFromVision?: boolean;
	suffix?: ReactNode;
	isEntity?: boolean;
	customValidity?: LinkControlValidity;
	/**
	 * Unused by the component, accepted from LinkControl.
	 */
	withURLSuggestion?: boolean;
}

/**
 * A search handler passed to `URLInput`, called with the search term and
 * whether the initial suggestions are requested.
 */
export type FetchLinkSuggestionsHandler = (
	value: string,
	options: { isInitialSuggestions?: boolean }
) => Promise< LinkControlSuggestion[] >;

/**
 * Props of `LinkControlSearchItem`.
 */
export interface LinkControlSearchItemProps {
	itemProps?: SuggestionItemProps;
	suggestion: LinkControlSuggestion;
	searchTerm?: string | null;
	onClick?: MouseEventHandler< HTMLButtonElement >;
	isURL?: boolean;
	shouldShowType?: boolean;
	index?: number;
	isSelected?: boolean;
	isFrontPage?: boolean;
	isBlogHome?: boolean;
}

/**
 * Props of `LinkControlSearchCreate`.
 */
export interface LinkControlSearchCreateProps {
	searchTerm?: string | null;
	onClick?: MouseEventHandler< HTMLButtonElement >;
	itemProps?: SuggestionItemProps;
	buttonText?: CreateSuggestionButtonText;
	isSelected?: boolean;
}

/**
 * Props of the link settings drawer.
 */
export interface LinkSettingsDrawerProps {
	children?: ReactNode;
	settingsOpen: boolean;
	setSettingsOpen: ( settingsOpen: boolean ) => void;
}

/**
 * Props of the link settings.
 */
export interface LinkControlSettingsProps {
	value?: LinkControlValue;
	onChange?: ( nextValue: LinkControlValue ) => void;
	settings?: LinkControlSetting[];
}

/**
 * Props of `LinkPreview`.
 */
export interface LinkPreviewProps {
	value: LinkControlValue;
	onEditClick: () => void;
	hasRichPreviews?: boolean;
	hasUnlinkControl?: boolean;
	onRemove?: () => void;
}
