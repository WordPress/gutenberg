/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { TextControl, PanelBody, ToggleControl } from '@wordpress/components';

/**
 * Limit the value to the range of a 32-bit signed integer.
 *
 * @param {string} value
 * @returns Number or undefined
 */
function limitIntegerValue( value ) {
	const intValue = parseInt( value, 10 );
	if ( isNaN( intValue ) ) {
		return undefined;
	}
	// Get the maximum absolute value of a 32-bit signed integer.
	const limit32bit = Math.pow( 2, 31 ) - 1;
	return Math.min( Math.max( intValue, -1 * limit32bit ), limit32bit );
}

const OrderedListSettings = ( { setAttributes, reversed, start } ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Ordered list settings' ) }>
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Start value' ) }
				type="number"
				onChange={ ( value ) => {
					const int = limitIntegerValue( value );

					setAttributes( {
						// It should be possible to unset the value,
						// e.g. with an empty string.
						start: isNaN( int ) ? undefined : int,
					} );
				} }
				value={ Number.isInteger( start ) ? start.toString( 10 ) : '' }
				step="1"
			/>
			<ToggleControl
				label={ __( 'Reverse list numbering' ) }
				checked={ reversed || false }
				onChange={ ( value ) => {
					setAttributes( {
						// Unset the attribute if not reversed.
						reversed: value || undefined,
					} );
				} }
			/>
		</PanelBody>
	</InspectorControls>
);

export default OrderedListSettings;
