/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	TextControl,
	PanelBody,
	ToggleControl,
	SelectControl,
} from '@wordpress/components';

const OrderedListSettings = ( { setAttributes, reversed, start, type } ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Ordered list settings' ) }>
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Start value' ) }
				type="number"
				onChange={ ( value ) => {
					const int = parseInt( value, 10 );

					setAttributes( {
						// It should be possible to unset the value,
						// e.g. with an empty string.
						start: isNaN( int ) ? undefined : int,
					} );
				} }
				value={ Number.isInteger( start ) ? start.toString( 10 ) : '' }
				step="1"
			/>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Numbering style' ) }
				options={ [
					{ value: 'decimal', label: __( 'Numbers' ) },
					{ value: 'upper-alpha', label: __( 'Uppercase letters' ) },
					{ value: 'lower-alpha', label: __( 'Lowercase letters' ) },
					{
						value: 'upper-roman',
						label: __( 'Uppercase Roman numerals' ),
					},
					{
						value: 'lower-roman',
						label: __( 'Lowercase Roman numerals' ),
					},
				] }
				value={ type }
				onChange={ ( newValue ) => setAttributes( { type: newValue } ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
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
