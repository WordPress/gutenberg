/**
 * External dependencies
 */
import { assign, has } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { TextControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { InspectorAdvancedControls } from '../components';

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
	// allow blocks to specify their own attribute definition with default values if needed.
	if ( has( settings.attributes, [ 'anchor', 'type' ] ) ) {
		return settings;
	}
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
export const withInspectorControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const hasAnchor = hasBlockSupport( props.name, 'anchor' );

		if ( hasAnchor && props.isSelected ) {
			return (
				<>
					<BlockEdit { ...props } />
					<InspectorAdvancedControls>
						<TextControl
							className="html-anchor-control"
							label={ __( 'HTML Anchor' ) }
							help={ (
								<>
									{ __( 'Enter a word or two — without spaces — to make a unique web address just for this heading, called an “anchor.” Then, you’ll be able to link directly to this section of your page.' ) }

									<ExternalLink href={ 'https://wordpress.org/support/article/page-jumps/' }>
										{ __( 'Learn more about anchors' ) }
									</ExternalLink>
								</>
							) }
							value={ props.attributes.anchor || '' }
							onChange={ ( nextValue ) => {
								nextValue = nextValue.replace( ANCHOR_REGEX, '-' );
								props.setAttributes( {
									anchor: nextValue,
								} );
							} } />
					</InspectorAdvancedControls>
				</>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'withInspectorControl' );

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
		extraProps.id = attributes.anchor === '' ? null : attributes.anchor;
	}

	return extraProps;
}

addFilter( 'blocks.registerBlockType', 'core/anchor/attribute', addAttribute );
addFilter( 'editor.BlockEdit', 'core/editor/anchor/with-inspector-control', withInspectorControl );
addFilter( 'blocks.getSaveContent.extraProps', 'core/anchor/save-props', addSaveProps );
