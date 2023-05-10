/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { store as blockEditorStore } from '../store';

/**
 * TODO: Add description.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withBehaviors = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		// Only add behaviors to the core/image block.
		if ( props.name !== 'core/image' ) {
			return <BlockEdit { ...props } />;
		}

		const { behaviors: blockBehaviors } = props.attributes;
		const settings = select( blockEditorStore ).getSettings();
		const themeBehaviors =
			settings?.__experimentalFeatures?.blocks?.[ props.name ]?.behaviors;

		if ( ! blockBehaviors && ! themeBehaviors ) {
			return <BlockEdit { ...props } />;
		}

		// By default, use the block behaviors.
		let behaviors = blockBehaviors;

		// If the theme has behaviors, but the block does not, use the theme behaviors.
		if ( ! blockBehaviors && themeBehaviors ) {
			behaviors = themeBehaviors;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="advanced">
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Behaviors' ) }
						// At the moment we are only supporting one behavior (lightbox)
						value={ behaviors?.lightbox || '' }
						options={ Object.keys( behaviors )
							.map( ( behavior ) => ( {
								value: behavior,
								label: behavior.toUpperCase(),
							} ) )
							.concat( {
								value: '',
								label: __( 'None' ),
							} ) }
						onChange={ ( nextValue ) => {
							props.setAttributes( {
								behaviors: {
									lightbox: nextValue === '' ? false : true,
								},
							} );
						} }
						hideCancelButton={ true }
						help={ __( 'Add behaviors' ) }
						size="__unstable-large"
					/>
				</InspectorControls>
			</>
		);
	};
}, 'withBehaviors' );

addFilter(
	'editor.BlockEdit',
	'core/behaviors/with-inspector-control',
	withBehaviors
);
