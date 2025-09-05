/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { insert, insertObject } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { keyboardReturn, lineDashed } from '@wordpress/icons';

const nameWbr = 'core/line-break-wbr';
const titleWbr = __( 'Insert word break' );

export const lineBreakWbr = {
	name: nameWbr,
	title: titleWbr,
	tagName: 'wbr',
	object: true,
	className: 'wp-inline-wbr',
	edit( { value, onChange, onFocus } ) {
		const onClick = () => {
			onChange( insertObject( value, { type: nameWbr } ) );
			onFocus();
		};

		return (
			<RichTextToolbarButton
				icon={ keyboardReturn }
				title={ __( 'Insert word break' ) }
				onClick={ onClick }
				role="menuitem"
			/>
		);
	},
};

const nameShy = 'core/soft-hyphen';
const titleShy = __( 'Insert soft hyphen' );

export const softHyphen = {
	name: nameShy,
	title: titleShy,
	tagName: 'span',
	className: 'is-soft-hyphen-format',
	edit( { value, onChange, onFocus } ) {
		const onClick = () => {
			onChange( insert( value, '\u00AD' ) );
			onFocus();
		};

		return (
			<RichTextToolbarButton
				icon={ lineDashed }
				title={ titleShy }
				onClick={ onClick }
				role="menuitem"
			/>
		);
	},
};
