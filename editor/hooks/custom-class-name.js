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
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom class name, if block supports custom class name.
 *
 * @param {function|Component} BlockEdit Original component.
 *
 * @return {string} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const hasCustomClassName = hasBlockSupport( props.name, 'customClassName', true );

		if ( hasCustomClassName && props.isSelected ) {
			return (
				<Fragment>
					<BlockEdit { ...props } />
					<InspectorAdvancedControls>
						<TextControl
							label={ __( 'Additional CSS Class' ) }
							value={ props.attributes.className || '' }
							onChange={ ( nextValue ) => {
								props.setAttributes( {
									className: nextValue,
								} );
							} }
						/>
					</InspectorAdvancedControls>
				</Fragment>
			);
		}

		return <BlockEdit { ...props } />;
	};
}, 'withInspectorControl' );

addFilter( 'blocks.BlockEdit', 'core/custom-class-name/inspector-control', withInspectorControl );
