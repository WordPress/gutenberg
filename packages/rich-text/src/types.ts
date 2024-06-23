/**
 * External dependencies
 */
import type { RefObject, ReactNode } from 'react';

export type State = { formatTypes: Record< string, RichTextFormatFull > };

/**
 * The type of a rich text format, such as core/bold.
 */
export type RichTextFormat = {
	type: RichTextFormatFull[ 'type' ];
};

export type RichTextFormatFull = {
	/**
	 * A string identifying the format. Must be unique across all registered formats.
	 */
	name: string;
	/**
	 * The HTML tag this format will wrap the selection with.
	 */
	tagName: string;
	/**
	 * A class to match the format.
	 */
	className: string | null;
	/**
	 * Name of the format.
	 */
	title: string;
	/**
	 * Edit function.
	 * @param props Edit props.
	 * @return A component for the user to interact with the new registered format.
	 */
	edit: ( props: {
		contentRef: RefObject< HTMLElement >;
		isActive: boolean;
		onChange: ( value: RichTextValue ) => void;
		value: RichTextValue;
	} ) => ReactNode;
	/**
	 * Whether format makes content interactive or not.
	 */
	interactive?: boolean;
	/**
	 * Maximum of 3 keywords to describe the format.
	 */
	keywords?: [ string ] | [ string, string ] | [ string, string, string ];
	/**
	 * HTML attributes to add to the element.
	 */
	attributes?: Record< string, string >;
	/**
	 * The type of a rich text format, such as core/bold.
	 */
	type?:
		| 'core/bold'
		| 'core/italic'
		| 'core/link '
		| 'core/strikethrough'
		| 'core/image'
		| ( string & {} );
};

/**
 * A list of rich text format types.
 */
export type RichTextFormatList = Array< RichTextFormatFull >;

/**
 * An object which represents a formatted string. The text property contains the
 * text to be formatted, and the formats property contains an array which indicates
 * the formats that are applied to each character in the text. See the main
 * `@wordpress/rich-text` documentation for more detail.
 */
export type RichTextValue = {
	text: string;
	formats: Array< RichTextFormatList >;
	replacements: Array< RichTextFormat >;
	start?: number;
	end?: number;
	activeFormats?: RichTextFormatList;
};
