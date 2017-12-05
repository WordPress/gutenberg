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
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'customClassName', true ) ) {
		// Use Lodash's assign to gracefully handle if attributes are undefined
		settings.attributes = assign( settings.attributes, {
			className: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the anchor ID, if block supports anchor
 *
 * @param  {Element} element Original edit element
 * @param  {Object}  props   Props passed to BlockEdit
 * @return {Element}         Filtered edit element
 */
export function addInspectorControl( element, props ) {
	if ( hasBlockSupport( props.name, 'customClassName', true ) && props.focus ) {
		element = [
			element,
			<InspectorControls key="inspector-custom-class-name">
				<InspectorControls.TextControl
					label={ __( 'Additional CSS Class' ) }
					value={ props.attributes.className || '' }
					onChange={ ( nextValue ) => {
						props.setAttributes( {
							className: nextValue,
						} );
					} }
				/>
			</InspectorControls>,
		];
	}

	return element;
}

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param  {Object} extraProps Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Current block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType, 'customClassName', true ) && attributes.className ) {
		extraProps.className = classnames( extraProps.className, attributes.className );
	}

	return extraProps;
}

export default function customClassName( { addFilter } ) {
	addFilter( 'registerBlockType', 'core/custom-class-name/attribute', addAttribute );
	addFilter( 'BlockEdit', 'core/custom-class-name/inspector-control', addInspectorControl );
	addFilter( 'getSaveContent.extraProps', 'core/custom-class-name/save-props', addSaveProps );
}
