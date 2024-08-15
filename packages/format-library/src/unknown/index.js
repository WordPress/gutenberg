/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { removeFormat, slice, isCollapsed } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { help } from '@wordpress/icons';

const name = 'core/unknown';
const title = __( 'Clear Unknown Formatting' );

function selectionContainsUnknownFormats( value ) {
	if ( isCollapsed( value ) ) {
		return false;
	}

	const selectedValue = slice( value );
	return selectedValue.formats.some( ( formats ) => {
		return formats.some( ( format ) => format.type === name );
	} );
}

export const unknown = {
	name,
	title,
	tagName: '*',
	className: null,
	edit( { isActive, value, onChange, onFocus } ) {
		if ( ! isActive && ! selectionContainsUnknownFormats( value ) ) {
			return null;
		}

		function onClick() {
			onChange( removeFormat( value, name ) );
			onFocus();
		}

		return (
			<RichTextToolbarButton
				name="unknown"
				icon={ help }
				title={ title }
				onClick={ onClick }
				isActive
			/>
		);
	},
};
