import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { button } from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import { unlock } from '../lock-unlock';

const { PrivateRichTextToolbarButton } = unlock( blockEditorPrivateApis );

const name = 'core/keyboard';
const title = __( 'Keyboard input' );

export const keyboard = {
	name,
	title,
	tagName: 'kbd',
	className: null,
	edit( { isActive, value, onChange, onFocus }: FormatEditProps ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<PrivateRichTextToolbarButton
				order={ 40 }
				icon={ button }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
