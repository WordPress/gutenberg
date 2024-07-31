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
		<PanelBody title={ __( 'Settings' ) }>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'List style' ) }
				options={ [
					{
						label: __( 'Numbers' ),
						value: 'decimal',
					},
					{
						label: __( 'Uppercase letters' ),
						value: 'upper-alpha',
					},
					{
						label: __( 'Lowercase letters' ),
						value: 'lower-alpha',
					},
					{
						label: __( 'Uppercase Roman numerals' ),
						value: 'upper-roman',
					},
					{
						label: __( 'Lowercase Roman numerals' ),
						value: 'lower-roman',
					},
				] }
				value={ type }
				onChange={ ( newValue ) => setAttributes( { type: newValue } ) }
			/>
			<TextControl
				__next40pxDefaultSize
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
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Reverse order' ) }
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
