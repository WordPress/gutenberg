import type { RichTextValue } from '@wordpress/rich-text';

/**
 * The props every format's `edit()` receives from the rich text toolbar.
 */
export interface FormatEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
}

/**
 * `FormatEditProps` for the formats whose toolbar button can be hidden.
 */
export interface FormatEditWithVisibilityProps extends FormatEditProps {
	isVisible?: boolean;
}

export interface NonBreakingSpacePopoverAnchorProps {
	contentRef: React.RefObject< HTMLElement >;
}

export type NonBreakingSpaceEditProps = Pick<
	FormatEditProps,
	'value' | 'onChange'
> &
	NonBreakingSpacePopoverAnchorProps;
export interface LanguageEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	contentRef: React.RefObject< HTMLElement >;
}

export interface InlineLanguageUIProps {
	value: RichTextValue;
	contentRef: React.RefObject< HTMLElement >;
	onChange: ( value: RichTextValue ) => void;
	onClose: () => void;
}

export interface InlineUIProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	activeAttributes: Record< string, string > | null;
	contentRef: React.RefObject< HTMLElement >;
	latexToMathML: (
		latex: string,
		options?: { displayMode?: boolean }
	) => string;
}

export interface EditMathProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	isObjectActive: boolean;
	activeObjectAttributes: Record< string, string > | null;
	contentRef: React.RefObject< HTMLElement >;
}

/**
 * A colour entry from the `color.palette` theme setting.
 */
export interface ColorObject {
	slug: string;
	color: string;
	name?: string;
}

export interface EditImageProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	isObjectActive: boolean;
	activeObjectAttributes: {
		style?: string;
		alt?: string | undefined;
		className?: string;
		url?: string;
	} | null;
	contentRef: React.RefObject< HTMLElement >;
}

/**
 * The subset of `EditImageProps` the inline image popover actually reads.
 */
export type InlineImageUIProps = Pick<
	EditImageProps,
	'value' | 'onChange' | 'activeObjectAttributes' | 'contentRef'
>;

export interface EditLinkProps {
	isActive: boolean;
	activeAttributes: LinkFormatAttributes;
	value: RichTextValue;
	onChange: ( newValue: RichTextValue ) => void;
	onFocus: () => void;
	contentRef: React.RefObject< HTMLElement >;
	isVisible?: boolean;
}

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

export interface InlineLinkUIProps {
	isActive: boolean;
	activeAttributes: LinkFormatAttributes;
	value: RichTextValue;
	onChange: ( newValue: RichTextValue ) => void;
	onFocusOutside: () => void;
	stopAddingLink: () => void;
	contentRef: React.RefObject< HTMLElement >;
	focusOnMount?: 'firstElement' | false;
}

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
