import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { subscript as subscriptIcon } from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import { unlock } from '../lock-unlock';

const { PrivateRichTextToolbarButton } = unlock( blockEditorPrivateApis );

const name = 'core/subscript';
const title = __( 'Subscript' );

export const subscript = {
	name,
	title,
	tagName: 'sub',
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
				order={ 70 }
				icon={ subscriptIcon }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
