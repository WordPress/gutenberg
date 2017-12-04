/**
 * External dependencies
 */
import { assign } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { hasBlockSupport } from '../api';
import InspectorControls from '../inspector-controls';

/**
 * Filters registered block settings, extending attributes with classDropdown
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'customClassDropdown', true ) ) {
		// Use Lodash's assign to gracefully handle if attributes are undefined
		settings.attributes = assign( settings.attributes, {
			classDropdown: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning custom class dropdown
 *
 * @param  {Element} element Original edit element
 * @param  {Object}  props   Props passed to BlockEdit
 * @return {Element}         Filtered edit element
 */
export function addInspectorControl( element, props ) {

	if ( hasBlockSupport( props.name, 'customClassDropdown', true ) && props.focus ) {

		let options = props.customClassDropdown && props.customClassDropdown[props.name] 
			? props.customClassDropdown[props.name] 
			: false;

		if ( options.length ) { 
			options = [ { label: __( 'Default' ), value: '' } ].concat( options );
		}

		element = [
			element,
			options && <InspectorControls key="inspector-custom-class-dropdown">
				<InspectorControls.SelectControl
					label={ __( 'Custom Style' ) }
					value={ props.attributes.classDropdown || '' }
					options={ options }
					onChange={ ( nextValue ) => {
						props.setAttributes( {
							classDropdown: nextValue,
						} );
					} }
				/>
			</InspectorControls>,
		];
	}

	return element;
}

/**
 * Override props assigned to save component to add custom class dropdown.
 * This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param  {Object} extraProps Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Current block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType, 'customClassDropdown', true ) && attributes.classDropdown ) {
		extraProps.className = classnames( extraProps.className, attributes.classDropdown );
	}

	return extraProps;
}

export default function customClassDropdown( { addFilter } ) {
	addFilter( 'registerBlockType', 'core-custom-class-dropdown-attribute', addAttribute );
	addFilter( 'BlockEdit', 'core-custom-class-dropdown-inspector-control', addInspectorControl );
	addFilter( 'getSaveContent.extraProps', 'core-custom-class-dropdown-save-props', addSaveProps );
}
