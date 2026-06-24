/*
 * WordPress dependencies
 */
import type { RichTextValue } from '@wordpress/rich-text';
export interface BoldEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	isVisible?: boolean;
}
export interface CodeEditProps {
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
}
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
