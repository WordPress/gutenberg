/**
 * External dependencies
 */
import { assign } from 'lodash';

/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { TextControl } from '@wordpress/components';
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
 * of the first node.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
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
 * assigning the anchor ID, if block supports anchor.
 *
 * @param {function|Component} BlockEdit Original component.
 *
 * @return {string} Wrapped component.
 */
export function withInspectorControl( BlockEdit ) {
	const WrappedBlockEdit = ( props ) => {
		const hasAnchor = hasBlockSupport( props.name, 'anchor' ) && props.isSelected;
		return [
			<BlockEdit key="block-edit-anchor" { ...props } />,
			hasAnchor && <InspectorControls key="inspector-anchor">
				<TextControl
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
	};
	WrappedBlockEdit.displayName = getWrapperDisplayName( BlockEdit, 'anchor' );

	return WrappedBlockEdit;
}

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType, 'anchor' ) ) {
		extraProps.id = attributes.anchor;
	}

	return extraProps;
}

addFilter( 'blocks.registerBlockType', 'core/anchor/attribute', addAttribute );
addFilter( 'blocks.BlockEdit', 'core/anchor/inspector-control', withInspectorControl );
addFilter( 'blocks.getSaveContent.extraProps', 'core/anchor/save-props', addSaveProps );
