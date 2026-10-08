/**
 * Stores the type of a rich text format, such as core/bold.
 */
export type RichTextFormat = {
	title?: string;
	attributes?: Record< string, string >;
	innerHTML?: string;
	type:
		| 'core/bold'
		| 'core/italic'
		| 'core/link'
		| 'core/strikethrough'
		| 'core/image'
		| string;
};

/**
 * A list of rich text format types.
 */
export type RichTextFormatList = Array< RichTextFormat >;

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
	start: number;
	end: number;
	activeFormats?: RichTextFormatList;
};

/**
 * A registered format type. `name` and `tagName` identify it, `className`
 * matches it against classes, and `edit` renders its toolbar UI.
 */
export type FormatType = {
	/**
	 * A string identifying the format. Must be unique across all registered
	 * formats.
	 */
	name: string;
	/**
	 * The HTML tag this format will wrap the selection with.
	 */
	tagName: string;
	/**
	 * Whether format makes content interactive or not.
	 */
	interactive?: boolean;
	/**
	 * Whether the format represents an object (e.g., `img`, `br`), an object
	 * cannot contain other format types.
	 */
	object?: boolean;
	/**
	 * A class to match the format.
	 */
	className: string | null;
	/**
	 * Name of the format.
	 */
	title: string;
	/**
	 * Should return a component for the user to interact with the new
	 * registered format.
	 */
	edit?: Function;
	keywords?: string[];
	attributes?: Record< string, string >;
	contentEditable?: boolean;
	__experimentalCreatePrepareEditableTree?: Function;
	__experimentalCreateOnChangeEditableValue?: Function;
	__experimentalGetPropsForEditableTreePreparation?: Function;
	__experimentalGetPropsForEditableTreeChangeHandler?: Function;
};

/**
 * State of the `core/rich-text` store.
 */
export type State = {
	formatTypes: Record< string, FormatType >;
};

export type Action =
	| { type: 'ADD_FORMAT_TYPES'; formatTypes: FormatType[] }
	| { type: 'REMOVE_FORMAT_TYPES'; names: string[] };

/**
 * A format parsed from an element, before `formatType` is stripped.
 */
export type ParsedFormat = RichTextFormat & {
	formatType?: FormatType;
	tagName?: string;
	unregisteredAttributes?: Record< string, string >;
};

/**
 * The boundary points of a `Range`, which `create` adjusts as it filters text.
 */
export type SelectionRange = Pick<
	Range,
	'startContainer' | 'startOffset' | 'endContainer' | 'endOffset'
>;
