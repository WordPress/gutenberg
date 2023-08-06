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

/**
 * Internal dependencies
 */
import { LIST_STYLE_TYPES } from './utils';

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
				options={ LIST_STYLE_TYPES.map( ( { label, value } ) => {
					return {
						label,
						value,
					};
				} ) }
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
