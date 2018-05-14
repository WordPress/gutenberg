/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, Fragment } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';

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
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorAdvancedControls>
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
					</InspectorAdvancedControls>
				</Fragment>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'withInspectorControl' );

addFilter( 'blocks.BlockEdit', 'core/anchor/inspector-control', withInspectorControl );
