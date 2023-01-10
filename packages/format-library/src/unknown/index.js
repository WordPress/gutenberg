/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { removeFormat, slice } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { help } from '@wordpress/icons';

const name = 'core/unknown';
const title = __( 'Clear Unknown Formatting' );

export const unknown = {
	name,
	title,
	tagName: '*',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		function onClick() {
			onChange( removeFormat( value, name ) );
			onFocus();
		}

		const selectedValue = slice( value );
		const hasUnknownFormats = selectedValue.formats.some( ( formats ) => {
			return formats.some( ( format ) => format.type === name );
		} );

		if ( ! isActive && ! hasUnknownFormats ) {
			return null;
		}

		return (
			<RichTextToolbarButton
				name="unknown"
				icon={ help }
				title={ title }
				onClick={ onClick }
				isActive={ true }
			/>
		);
	},
};
