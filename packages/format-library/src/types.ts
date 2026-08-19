import type { RichTextValue } from '@wordpress/rich-text';

interface BaseFormatEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
}

export type BoldEditProps = BaseFormatEditProps & { isVisible?: boolean };

export type NonBreakingSpaceEditProps = Pick<
	BaseFormatEditProps,
	'value' | 'onChange'
>;
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

export type {
	BaseFormatEditProps as CodeEditProps,
	BaseFormatEditProps as StrikethroughEditProps,
	BaseFormatEditProps as SubscriptEditProps,
	BaseFormatEditProps as SuperscriptEditProps,
	BaseFormatEditProps as UnknownEditProps,
};

export interface EditImageProps {
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus?: () => void;
	isObjectActive?: boolean;
	activeObjectAttributes: {
		style?: string;
		alt?: string | undefined;
		className?: string;
		url?: string;
	} | null;
	contentRef: React.RefObject< HTMLElement >;
}

export interface EditLinkProps {
	isActive: boolean;
	activeAttributes: {
		url: string;
		type?: string;
		id?: string;
		target?: string;
		rel?: string;
		class?: string;
	};
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
	activeAttributes: {
		url: string;
		type?: string;
		id?: string;
		target?: string;
		rel?: string;
		class?: string;
	};
	value: RichTextValue;
	onChange: ( newValue: RichTextValue ) => void;
	onFocusOutside: () => void;
	stopAddingLink: () => void;
	contentRef: React.RefObject< HTMLElement >;
	focusOnMount?: 'firstElement' | false;
}

/**
 * Generates the format object that will be applied to the link text.
 */
export interface LinkFormatOptions {
	/*
	 * The href of the link.
	 */
	url: string;
	/*
	 * The type of the link.
	 */
	type?: string;
	/*
	 * The ID of the link.
	 */
	id?: string;
	/*
	 * Whether this link will open in a new window.
	 */
	opensInNewWindow?: boolean;
	/*
	 * Whether this link is marked as no follow relationship.
	 */
	nofollow?: boolean;
	/*
	 * The CSS classes to apply to the link.
	 */
	cssClasses?: string;
}

export interface LinkFormatAttributes {
	url: string;
	type?: string;
	id?: string;
	target?: string;
	rel?: string;
	class?: string;
}

export interface LinkFormat {
	type: 'core/link';
	attributes: LinkFormatAttributes;
}
