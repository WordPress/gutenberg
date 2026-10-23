import type {
	AllHTMLAttributes,
	ComponentProps,
	ElementType,
	ReactNode,
	Ref,
	RefObject,
} from 'react';
import type { Block } from '@wordpress/blocks';
import type { ToolbarButton } from '@wordpress/components';
import type { DataRegistry } from '@wordpress/data';
import type { WPKeycodeModifier } from '@wordpress/keycodes';
import type {
	registerFormatType,
	RichTextData,
	RichTextValue,
} from '@wordpress/rich-text';
import type { usesContextKey } from './format-edit';
import type { Completer } from '../autocomplete/types';
import type { InitialPosition } from '../../store/types';

// `@wordpress/rich-text` does not export the format type.
type FormatType = NonNullable< ReturnType< typeof registerFormatType > >;

/**
 * The value of a rich text field: an HTML string, rich text data, or the
 * deprecated children array.
 */
export type RichTextFieldValue =
	string | RichTextData | Array< string | Record< string, unknown > >;

/**
 * A registered format type as the field renders it.
 */
export type RichTextFormatType = FormatType & {
	edit?: ElementType< FormatEditProps >;
	[ usesContextKey ]?: string[];
};

/**
 * Props passed to the `edit` component of a format type.
 */
export type FormatEditProps = {
	isActive: boolean;
	isVisible?: boolean;
	activeAttributes: Record< string, string >;
	isObjectActive: boolean;
	activeObjectAttributes: Record< string, string >;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	contentRef: RefObject< HTMLElement | null >;
	context: Record< string, unknown >;
};

/**
 * The format restrictions of a mounted rich text field.
 */
export type FieldFormatSettings = {
	allowedFormats?: readonly string[];
	withoutInteractiveFormatting?: boolean;
	disabled?: boolean;
};

/**
 * A snapshot of the value, to classify the change since the last one.
 */
export type MarkPersistentSnapshot = {
	html: unknown;
	text: string;
	hasActiveFormats: boolean;
};

export type UseMarkPersistentOptions = {
	html: unknown;
	value: Pick< RichTextValue, 'text' | 'activeFormats' >;
	onMarkPersistent: () => void;
};

/**
 * Props of `RichText.Content`. Other props go to the element.
 */
export type RichTextContentProps = {
	value?: RichTextFieldValue | null;
	tagName?: ElementType;
	multiline?: string | boolean;
	format?: string;
	[ key: string ]: unknown;
};

/**
 * Props of `RichTextToolbarButton`. Other props go to the toolbar button.
 */
export type RichTextToolbarButtonProps = {
	name?: string;
	shortcutType?: WPKeycodeModifier;
	shortcutCharacter?: string;
} & ComponentProps< typeof ToolbarButton >;

export type FormatToolbarContainerProps = {
	inline?: boolean;
	editableContentElement?: HTMLElement | null;
};

/**
 * A fill of the rich text toolbar slot: the toolbar button element, whose
 * props are those of `RichTextToolbarButton`.
 */
export type ToolbarControlFill = [
	{
		props: ComponentProps< typeof ToolbarButton > & {
			isActive?: boolean;
			title: string;
		};
	},
];

type FormatEditBaseProps = {
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	value: RichTextValue;
	forwardedRef: RefObject< HTMLElement | null >;
	isVisible?: boolean;
};

export type FormatEditItemProps = FormatEditBaseProps & {
	settings: RichTextFormatType;
};

export type FormatEditComponentProps = FormatEditBaseProps & {
	formatTypes: RichTextFormatType[];
};

/**
 * Props of the deprecated multiline field. Other props go to each line.
 */
export type RichTextMultilineProps = Omit<
	RichTextProps,
	'value' | 'onChange' | 'ref'
> & {
	value?: string;
	onChange: ( value: string ) => void;
};

export type RichTextMultilineLineProps = Omit<
	RichTextMultilineProps,
	'onChange' | 'tagName' | 'multiline' | 'children'
> & {
	value: string;
	values: string[];
	onChange: ( values: string[] ) => void;
	index: number;
	multilineTagName?: 'p' | 'li';
};

export type RichTextMultilineLineState = RichTextMultilineLineProps & {
	clientId?: string;
};

/**
 * A block binding of a rich text attribute.
 */
export type RichTextBinding = {
	source: string;
	args?: Record< string, unknown > & { key?: string };
};

type Shortcuts = Set< ( event: KeyboardEvent ) => void >;
type InputEvents = Set< ( event: InputEvent ) => void >;

/**
 * The value props. `onChange` receives the same kind of value the field was
 * given, or the plain text when formats are disabled.
 */
type RichTextValueProps< V extends RichTextFieldValue > =
	| {
			value?: V;
			// Only `value` picks the value type.
			onChange?: ( value: NoInfer< V > ) => void;
			__unstableDisableFormats?: false;
	  }
	| {
			value?: V;
			onChange?: ( value: string ) => void;
			__unstableDisableFormats: true;
	  };

/**
 * Props of the `RichText` component. Other props go to the editable element.
 */
export type RichTextOwnProps<
	V extends RichTextFieldValue = RichTextFieldValue,
> = RichTextValueProps< V > & {
	children?: ( props: {
		value: RichTextValue;
		onChange: ( value: RichTextValue ) => void;
		onFocus: () => void;
	} ) => ReactNode;
	tagName?: ElementType;
	isSelected?: boolean;
	multiline?: boolean | string;
	inlineToolbar?: boolean;
	wrapperClassName?: string;
	autocompleters?: Completer[];
	onReplace?: (
		blocks: Block | Block[],
		indexToSelect?: number,
		initialPosition?: InitialPosition
	) => void;
	placeholder?: string;
	allowedFormats?: readonly string[];
	withoutInteractiveFormatting?: boolean;
	onRemove?: ( forward: boolean ) => void;
	onMerge?: ( forward: boolean ) => void;
	onSplit?: ( value: string, isOriginal?: boolean ) => Block;
	__unstableOnSplitAtEnd?: () => void;
	__unstableOnSplitAtDoubleLineEnd?: () => void;
	identifier?: string;
	preserveWhiteSpace?: boolean;
	__unstablePastePlainText?: boolean;
	__unstableEmbedURLOnPaste?: boolean;
	disableLineBreaks?: boolean;
	__unstableAllowPrefixTransformations?: boolean;
	/**
	 * When true, format types' `__unstableInputRule` handlers (e.g. the
	 * backtick-to-code transform) are skipped for this field. Prefix block
	 * transforms are unaffected.
	 */
	__unstableDisableFormatInputRules?: boolean;
	readOnly?: boolean;
};

/**
 * The element attributes cover any `tagName`, such as `href` for a link.
 */
export type RichTextProps< V extends RichTextFieldValue = RichTextFieldValue > =
	RichTextOwnProps< V > &
		Omit< AllHTMLAttributes< HTMLElement >, keyof RichTextOwnProps > & {
			ref?: Ref< HTMLElement >;
			[ key: `data-${ string }` ]: unknown;
		};

/**
 * The latest props of the rich text event listeners, read when an event
 * fires.
 */
export type RichTextEventListenerProps = {
	registry: DataRegistry;
	getValue: () => RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	__unstableAllowPrefixTransformations?: boolean;
	__unstableDisableFormatInputRules?: boolean;
	formatTypes: RichTextFormatType[];
	onReplace?: RichTextOwnProps[ 'onReplace' ];
	selectionChange: (
		...args:
			| []
			| [
					clientId: string,
					attributeKey?: string,
					startOffset?: number,
					endOffset?: number,
			  ]
	) => void;
	isSelected?: boolean;
	disableFormats?: boolean;
	value: RichTextValue;
	tagName: ElementType;
	onSplit?: RichTextOwnProps[ 'onSplit' ];
	__unstableEmbedURLOnPaste?: boolean;
	pastePlainText?: boolean;
	onMerge?: ( forward: boolean ) => void;
	onRemove?: ( forward: boolean ) => void;
	disableLineBreaks?: boolean;
	onSplitAtEnd?: () => void;
	onSplitAtDoubleLineEnd?: () => void;
	keyboardShortcuts: Shortcuts;
	inputEvents: InputEvents;
	supportsSplitting?: boolean;
	preserveWhiteSpace?: boolean;
};

/**
 * Subscribes a rich text event listener to the editable element and returns
 * a cleanup.
 */
export type RichTextEventListener = (
	props: RefObject< RichTextEventListenerProps >
) => ( element: HTMLElement ) => () => void;

export interface RichTextShortcutProps {
	/** The character key of the shortcut. */
	character: string;
	/** The modifier of the shortcut, such as `primary`. */
	type: WPKeycodeModifier;
	/** Called when the shortcut is used. */
	onUse: () => void;
}

export interface RichTextInputEventProps {
	/** The `InputEvent.inputType` to handle, such as `formatBold`. */
	inputType: string;
	/** Called when an input event of `inputType` is fired. */
	onInput: () => void;
}
