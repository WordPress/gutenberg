import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { superscript as superscriptIcon } from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import { unlock } from '../lock-unlock';

const { PrivateRichTextToolbarButton } = unlock( blockEditorPrivateApis );

const name = 'core/superscript';
const title = __( 'Superscript' );

export const superscript = {
	name,
	title,
	tagName: 'sup',
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
				order={ 60 }
				icon={ superscriptIcon }
				title={ title }
				onClick={ onClick }
				isActive={ isActive }
				role="menuitemcheckbox"
			/>
		);
	},
};
