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
