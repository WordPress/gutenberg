/**
 * External dependencies
 */
import { assign } from 'lodash';

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
 * Regular expression matching invalid anchor characters for replacement.
 *
 * @type {RegExp}
 */
const ANCHOR_REGEX = /[\s#]/g;

/**
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'anchor' ) ) {
		// Use Lodash's assign to gracefully handle if attributes are undefined
		settings.attributes = assign( settings.attributes, {
			anchor: {
				type: 'string',
				source: 'attribute',
				attribute: 'id',
				selector: '*',
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
	if ( hasBlockSupport( props.name, 'anchor' ) && props.focus ) {
		element = [
			element,
			<InspectorControls key="inspector-anchor">
				<InspectorControls.TextControl
					label={ __( 'HTML Anchor' ) }
					help={ __( 'Anchors lets you link directly to a section on a page.' ) }
					value={ props.attributes.anchor || '' }
					onChange={ ( nextValue ) => {
						nextValue = nextValue.replace( ANCHOR_REGEX, '-' );

						props.setAttributes( {
							anchor: nextValue,
						} );
					} } />
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
	if ( hasBlockSupport( blockType, 'anchor' ) ) {
		extraProps.id = attributes.anchor;
	}

	return extraProps;
}

export default function anchor( { addFilter } ) {
	addFilter( 'registerBlockType', 'core-anchor-attribute', addAttribute );
	addFilter( 'BlockEdit', 'core-anchor-inspector-control', addInspectorControl );
	addFilter( 'getSaveContent.extraProps', 'core-anchor-save-props', addSaveProps );
}
