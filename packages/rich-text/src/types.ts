import type { RefObject } from 'react';
import type { WPKeycodeModifier } from '@wordpress/keycodes';
import type * as actions from './store/actions';

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
 * The content of a `RichTextValue`, without the selection.
 */
export type RichTextContent = Pick<
	RichTextValue,
	'text' | 'formats' | 'replacements'
>;

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
	__unstableInputRule?: ( value: RichTextValue ) => RichTextValue;
	__unstablePasteRule?: (
		value: RichTextValue,
		data: { html: string; plainText: string }
	) => RichTextValue;
};

/**
 * State of the `core/rich-text` store.
 */
export type State = {
	formatTypes: Record< string, FormatType >;
};

export type Action = ReturnType< ( typeof actions )[ keyof typeof actions ] >;

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

/**
 * Props of `RichTextShortcut`, which calls `onUse` when the shortcut is pressed.
 */
export type RichTextShortcutProps = {
	/**
	 * The character key of the shortcut.
	 */
	character: string;
	/**
	 * The modifier of the shortcut, such as `primary`.
	 */
	type: WPKeycodeModifier;
	/**
	 * Called when the shortcut is pressed.
	 */
	onUse: () => void;
};

/**
 * Props of `RichTextInputEvent`, which calls `onInput` for a given input type.
 */
export type RichTextInputEventProps = {
	/**
	 * The `InputEvent.inputType` to handle, such as `formatBold`.
	 */
	inputType: string;
	/**
	 * Called when an input event of `inputType` is fired.
	 */
	onInput: () => void;
};

/**
 * Attributes of an element created by `toTree`. Editable trees also set
 * boolean flags such as `data-rich-text-bogus`.
 */
export type TreeAttributes = Record< string, string | boolean >;

/**
 * An element to create while building a tree from a rich text value.
 */
export type TreeElement = {
	type: string;
	attributes?: TreeAttributes;
	object?: boolean;
};

/**
 * Raw HTML to insert while building a tree from a rich text value.
 */
export type TreeHTML = {
	html: string;
};

/**
 * Options of `toTree`. The callbacks build a tree of `T`, such as DOM nodes or
 * plain objects.
 */
export type ToTreeOptions< T > = {
	value: RichTextValue;
	preserveWhiteSpace?: boolean;
	createEmpty: () => T;
	append: {
		( parent: T, object: TreeHTML ): unknown;
		( parent: T, object: string | TreeElement ): T;
	};
	getLastChild: ( node: T ) => T | null | undefined;
	getParent: ( node: T ) => T;
	isText: ( node: T ) => boolean;
	getText: ( node: T ) => string;
	remove: ( node: T ) => T;
	appendText: ( node: T, text: string ) => void;
	onStartIndex?: ( tree: T, pointer: T ) => void;
	onEndIndex?: ( tree: T, pointer: T ) => void;
	isEditableTree?: boolean;
	placeholder?: string;
};

/**
 * The selection of a tree built by `toDom`, as paths of child indices from the
 * root, ending with the offset.
 */
export type ToDomSelection = {
	startPath: number[];
	endPath: number[];
};

/**
 * A node of the plain object tree `toHTMLString` builds. Text nodes have
 * `text`, raw HTML has `html`, and elements have `type`.
 */
export type HTMLTreeNode = {
	type?: string;
	attributes?: TreeAttributes;
	object?: boolean;
	html?: string;
	text?: string;
	parent?: HTMLTreeNode;
	children?: HTMLTreeNode[];
};

/**
 * Format types register their keyboard shortcut and input event callbacks
 * into these Sets via `KeyboardShortcutContext` / `InputEventContext`. The
 * rich text field that owns the editable element provides the Sets.
 */
export type EventListenersProps = {
	keyboardShortcuts: EventCallbacksRef< KeyboardEvent >;
	inputEvents: EventCallbacksRef< Event >;
};

/**
 * A ref to the Set of callbacks that format types register for an event.
 */
export type EventCallbacksRef< E extends Event > = RefObject<
	Set< ( event: E ) => void >
>;
