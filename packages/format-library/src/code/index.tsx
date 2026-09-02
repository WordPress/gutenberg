import { __ } from '@wordpress/i18n';
import { toggleFormat, remove, applyFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	// @ts-expect-error Block Editor not fully typed yet.
} from '@wordpress/block-editor';
import { code as codeIcon } from '@wordpress/icons';
import type { RichTextValue } from '@wordpress/rich-text';
import type { FormatEditProps } from '../types';

const name = 'core/code';
const title = __( 'Inline code' );

export const code = {
	name,
	title,
	tagName: 'code',
	className: null,
	__unstableInputRule( value: RichTextValue ): RichTextValue {
		const BACKTICK = '`';
		const { start, text } = value;
		const characterBefore = text[ start - 1 ];

		// Quick check the text for the necessary character.
		if ( characterBefore !== BACKTICK ) {
			return value;
		}

		if ( start - 2 < 0 ) {
			return value;
		}

		const indexBefore = text.lastIndexOf( BACKTICK, start - 2 );
		if ( indexBefore === -1 ) {
			return value;
		}

		const startIndex = indexBefore;
		const endIndex = start - 2;

		if ( startIndex === endIndex ) {
			return value;
		}

		value = remove( value, startIndex, startIndex + 1 );
		value = remove( value, endIndex, endIndex + 1 );
		value = applyFormat( value, { type: name }, startIndex, endIndex );

		return value;
	},
	edit( {
		value,
		onChange,
		onFocus,
		isActive,
	}: FormatEditProps ): React.ReactNode {
		function onClick() {
			onChange( toggleFormat( value, { type: name, title } ) );
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="access"
					character="x"
					onUse={ onClick }
				/>
				<RichTextToolbarButton
					icon={ codeIcon }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					role="menuitemcheckbox"
				/>
			</>
		);
	},
};
