/**
 * WordPress dependencies
 */
import { registerFormatType, toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
export const registerCustomFormatTypes = () => {
	registerFormatType( 'custom-formats/small', {
		title: __( 'Small' ),
		tagName: 'small',
		className: null,
		edit: ( { isActive, onChange, value } ) => {
			return (
				<RichTextToolbarButton
					icon="text" // You can use an appropriate icon from WordPress
					title={ __( 'Small' ) }
					onClick={ () => {
						onChange(
							toggleFormat( value, {
								type: 'custom-formats/small',
							} )
						);
					} }
					isActive={ isActive }
				/>
			);
		},
	} );
};
