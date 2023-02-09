/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';
/**
 * External dependencies
 */
import type { MutableRefObject, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import type { useAutocomplete } from '.';

type GetOptions< TCompleterOption = any > = (
	filterValue: AutocompleterUIProps[ 'filterValue' ]
) => Array< TCompleterOption > | Promise< Array< TCompleterOption > >;

export type OptionCompletion = {
	action: 'insert-at-caret' | 'replace';
	value: string | WPElement;
};

type OptionLabel = string | WPElement | Array< string | WPElement >;
export type KeyedOption = {
	key: string;
	value: any;
	label: OptionLabel;
	keywords: Array< string >;
	isDisabled: boolean;
};

export type WPCompleter< TCompleterOption = any > = {
	/**
	 * The name of the completer. Useful for identifying a specific completer to
	 * be overridden via extensibility hooks.
	 */
	name: string;
	/**
	 * The string prefix that should trigger the completer. For example,
	 * Gutenberg's block completer is triggered when the '/' character is entered.
	 */
	triggerPrefix: string;
	/**
	 * The raw options for completion. May be an array, a function that returns
	 * an array, or a function that returns a promise for an array.
	 * Options may be of any type or shape. The completer declares how those
	 * options are rendered and what their completions should be when selected.
	 */
	options: Array< TCompleterOption > | GetOptions;
	/**
	 * A function that returns the keywords for the specified option.
	 */
	getOptionKeywords?: ( option: TCompleterOption ) => Array< string >;
	/**
	 * A function that returns whether or not the specified option is disabled.
	 * Disabled options cannot be selected.
	 */
	isOptionDisabled?: ( option: TCompleterOption ) => boolean;
	/**
	 * A function that returns the label for a given option. A label may be a
	 * string or a mixed array of strings, elements, and components.
	 */
	getOptionLabel: ( option: TCompleterOption ) => OptionLabel;
	/**
	 * A function that takes a Range before and a Range after the autocomplete
	 * trigger and query text and returns a boolean indicating whether the
	 * completer should be considered for that context.
	 */
	allowContext?: ( before: string, after: string ) => boolean;
	/**
	 * A function that takes an option and returns how the option should
	 * be completed. By default, the result is a value to be inserted in the text.
	 * However, a completer may explicitly declare how a completion should be
	 * treated by returning an object with `action` and `value` properties. The
	 * `action` declares what should be done with the `value`.
	 */
	getOptionCompletion?: (
		option: TCompleterOption,
		query: string
	) => OptionCompletion | OptionCompletion[ 'value' ];
	/**
	 * A function that returns an array of items to be displayed in the
	 * Autocomplete UI. These items have uniform shape and have been filtered by
	 * `AutocompleterUIProps.filterValue`.
	 */
	useItems?: ( filterValue: string ) => [ Array< KeyedOption > ];
	/**
	 * Whether or not changes to the `filterValue` should be debounced.
	 */
	isDebounced?: boolean;
	/**
	 * A CSS class name to be applied to the completion menu.
	 */
	className?: string;
};

type ContentRef = MutableRefObject< HTMLElement | undefined >;

export type AutocompleterUIProps = {
	/**
	 * The value to filter the options by.
	 */
	filterValue: string;
	/**
	 * An id unique to each instance of the component, used in the IDs of the
	 * buttons generated for individual options.
	 */
	instanceId: number;
	/**
	 * The id of to be applied to the listbox of options.
	 */
	listBoxId: string | undefined;
	/**
	 * The class to apply to the wrapper element.
	 */
	className?: string;
	/**
	 * The index of the currently selected option.
	 */
	selectedIndex: number;
	/**
	 * A function to be called when the filterValue changes.
	 */
	onChangeOptions: ( items: Array< KeyedOption > ) => void;
	/**
	 * A function to be called when an option is selected.
	 */
	onSelect: ( option: KeyedOption ) => void; //should the param be an index?
	/**
	 * A function to be called when the completer is reset (e.g. when the user hits the escape key).
	 */
	onReset?: () => void;
	/**
	 * A function that defines the behavior of the completer when it is reset
	 */
	reset: ( event: Event ) => void;
	/**
	 * The rich text value object the autocomleter is being applied to.
	 */
	value: RichTextValue;
	/**
	 * A ref containing the editable element that will serve as the anchor for `Autocomplete`'s `Popover`.
	 */
	contentRef: ContentRef;
};

/**
 * A debounced promise used retrieve completer options.
 *
 * @see `get-default-use-items.tsx`
 */
export type DebouncedPromise< T = void > = Promise< T > & {
	canceled?: boolean;
};

/**
 * When `@wordpress/rich-text` is fully typed, the following
 * types should be moved to and imported from there
 *
 * @see @wordpress/rich-text/src/create.js
 */
type RichTextFormat = {
	type: string;
};
type RichTextFormatList = Array< RichTextFormat >;
type RichTextValue = {
	text: string;
	formats?: Array< RichTextFormatList >;
	replacements?: Array< RichTextFormat >;
	start: number | undefined;
	end: number | undefined;
};

export type UseAutocompleteProps = {
	/**
	 * The rich text value object the autocomleter is being applied to.
	 */
	record: RichTextValue & {
		start: NonNullable< RichTextValue[ 'start' ] >;
		end: NonNullable< RichTextValue[ 'end' ] >;
	};
	/**
	 * A function to be called when an option is selected to insert into the existing text.
	 */
	onChange: ( value: string ) => void;
	/**
	 * A function to be called when an option is selected to replace the existing text.
	 */
	onReplace: ( arg: [ OptionCompletion[ 'value' ] ] ) => void;
	/**
	 * An array of all of the completers to apply to the current element.
	 */
	completers: Array< WPCompleter >;
	/**
	 * A ref containing the editable element that will serve as the anchor for `Autocomplete`'s `Popover`.
	 */
	contentRef: ContentRef;
};

export type AutocompleteProps = UseAutocompleteProps & {
	/**
	 * A function that returns nodes to be rendered within the Autocomplete.
	 */
	children: (
		props: Omit< ReturnType< typeof useAutocomplete >, 'popover' >
	) => ReactNode;
	/**
	 * Whether or not the Autocomplte componenet is selected, and if its `Popover`
	 * should be displayed.
	 */
	isSelected: boolean;
};
