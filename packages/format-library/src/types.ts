/*
 * WordPress dependencies
 */
import type { RichTextValue } from '@wordpress/rich-text';

interface BaseFormatEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
}

export type BoldEditProps = BaseFormatEditProps & { isVisible?: boolean };

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

export type {
	BaseFormatEditProps as CodeEditProps,
	BaseFormatEditProps as StrikethroughEditProps,
	BaseFormatEditProps as SubscriptEditProps,
	BaseFormatEditProps as SuperscriptEditProps,
	BaseFormatEditProps as UnknownEditProps,
};
