/**
 * External dependencies
 */
import { assign } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';
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
 * assigning the custom class name, if block supports custom class name.
 *
 * @param  {function|Component} BlockEdit Original component
 * @return {function}                     Wrapped component
 */
export function withInspectorControl( BlockEdit ) {
	const WrappedBlockEdit = ( props ) => {
		if ( ! hasBlockSupport( props.name, 'customClassName', true ) || ! props.focus ) {
			return <BlockEdit { ...props } />;
		}

		return [
			<BlockEdit key="edit-block-custom-class-name" { ...props } />,
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
	};
	WrappedBlockEdit.displayName = getWrapperDisplayName( BlockEdit, 'customClassName' );

	return WrappedBlockEdit;
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
	addFilter( 'BlockEdit', 'core/custom-class-name/inspector-control', withInspectorControl );
	addFilter( 'getSaveContent.extraProps', 'core/custom-class-name/save-props', addSaveProps );
}
