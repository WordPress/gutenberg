/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

type GetOptions< TCompleterOption = any > = (
	filterValue: AutocompleterUIProps[ 'filterValue' ]
) => Array< TCompleterOption > | Promise< Array< TCompleterOption > >;

export type OptionCompletion = {
	action: 'insert-at-caret' | 'replace';
	value: string | WPElement;
};

type getOptionCompletion< TCompleterOption = any > = (
	option: TCompleterOption,
	query: string
) => OptionCompletion | OptionCompletion[ 'value' ];

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
	getOptionCompletion?: getOptionCompletion;
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
