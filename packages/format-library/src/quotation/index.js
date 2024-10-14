/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { toggleFormat } from '@wordpress/rich-text';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { quote as quoteIcon } from '@wordpress/icons';

const name = 'core/quotation';
const title = __( 'Inline Quotation' );

export const quotation = {
	name,
	title,
	tagName: 'q',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		function onToggle() {
			onChange( toggleFormat( value, { type: name, title } ) );
		}

		function onClick() {
			onToggle();
			onFocus();
		}

		return (
			<>
				<RichTextShortcut
					type="access"
					character="q"
					onUse={ onToggle }
				/>
				<RichTextToolbarButton
					icon={ quoteIcon }
					title={ title }
					onClick={ onClick }
					isActive={ isActive }
					role="menuitemcheckbox"
				/>
			</>
		);
	},
};
