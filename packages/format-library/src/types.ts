import type { RichTextValue } from '@wordpress/rich-text';

/**
 * The props the rich text toolbar passes to every format's `edit()`.
 *
 * `Attributes` types the format's own attribute bag. Only one of
 * `activeAttributes` and `activeObjectAttributes` carries meaning for a given
 * format: the former for inline formats, the latter for object formats.
 */
export interface FormatEditProps< Attributes = Record< string, string > > {
	isActive: boolean;
	activeAttributes: Attributes;
	isObjectActive: boolean;
	activeObjectAttributes: Attributes;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	contentRef: React.RefObject< HTMLElement >;
	/**
	 * The block context values the format asked for through `usesContext`.
	 */
	context: Record< string, unknown >;
	/**
	 * Whether the format's toolbar button should render. Hosts that never hide
	 * format buttons leave it unset, so treat an absent value as `true`.
	 */
	isVisible?: boolean;
}

/**
 * The registration object for the `core/language` format.
 */
export interface LanguageFormat {
	name: string;
	title: string;
	tagName: string;
	className: null;
	attributes: {
		lang: string;
		dir: string;
	};
	edit: ( props: FormatEditProps ) => React.ReactNode;
}

export type InlineLanguageUIProps = Pick<
	FormatEditProps,
	'value' | 'onChange' | 'contentRef'
> & {
	onClose: () => void;
};

/**
 * A colour entry from the `color.palette` theme setting.
 */
export interface ColorObject {
	slug: string;
	color: string;
	name?: string;
}

export type InlineColorUIProps = Pick<
	FormatEditProps,
	'isActive' | 'value' | 'onChange' | 'contentRef'
> & {
	name: string;
	onClose: () => void;
};

export interface ColorPickerProps {
	name: string;
	property: 'color' | 'backgroundColor';
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
}

export type InlineMathUIProps = Pick<
	FormatEditProps,
	'value' | 'onChange' | 'activeObjectAttributes' | 'contentRef'
> & {
	/**
	 * Resolves once `@wordpress/latex-to-mathml` has loaded; undefined until then.
	 */
	latexToMathML?: (
		latex: string,
		options?: { displayMode?: boolean }
	) => string;
};

/**
 * The attributes carried on an active `core/image` format.
 */
export type ImageFormatAttributes = {
	className?: string;
	style?: string;
	url?: string;
	alt?: string;
};

/**
 * The subset of the image format's props the inline image popover reads.
 */
export type InlineImageUIProps = Pick<
	FormatEditProps< ImageFormatAttributes >,
	'value' | 'onChange' | 'activeObjectAttributes' | 'contentRef'
>;

export interface OpenedBy {
	el: HTMLElement;
	action: 'click' | null;
}

export interface LinkValue {
	url?: string;
	type?: string;
	id?: string | number;
	opensInNewTab?: boolean;
	nofollow?: boolean;
	title?: string;
	cssClasses?: string;
}

/**
 * Props for the Link UI's "Additional CSS class(es)" setting.
 */
export interface CSSClassesSettingProps {
	setting: { id: string; title: string };
	value?: { cssClasses?: string };
	onChange: ( newValue: { cssClasses?: string } ) => void;
}

export type InlineLinkUIProps = Pick<
	FormatEditProps< LinkFormatAttributes >,
	'isActive' | 'activeAttributes' | 'value' | 'onChange' | 'contentRef'
> & {
	onFocusOutside: () => void;
	stopAddingLink: () => void;
	focusOnMount?: 'firstElement' | false;
};

/**
 * The options accepted by `createLinkFormat`.
 */
export interface LinkFormatOptions {
	/**
	 * The href of the link.
	 */
	url: string;
	/**
	 * The type of the link.
	 */
	type?: string;
	/**
	 * The ID of the link.
	 */
	id?: string;
	/**
	 * Whether this link will open in a new window.
	 */
	opensInNewWindow?: boolean;
	/**
	 * Whether this link is marked as no follow relationship.
	 */
	nofollow?: boolean;
	/**
	 * The CSS classes to apply to the link.
	 */
	cssClasses?: string;
}

/**
 * The attributes carried on an active `core/link` format.
 */
export type LinkFormatAttributes = {
	url: string;
	type?: string;
	id?: string;
	target?: string;
	rel?: string;
	class?: string;
};

export interface LinkFormat {
	type: 'core/link';
	attributes: LinkFormatAttributes;
}
