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
 * Override the default edit UI to include a new block inspector control for
 * assigning behaviors to blocks if behaviors are enabled in the theme.json.
 *
 * Currently, only the `core/image` block is supported.
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

		// Check the value of `settings.blocks.core/image.behaviorsUIEnabled` in the
		// theme.json. If false, do not add the behaviors inspector control.
		const settings = select( blockEditorStore ).getSettings();
		if (
			! settings?.__experimentalFeatures?.blocks?.[ props.name ]
				?.behaviorsUIEnabled
		) {
			return <BlockEdit { ...props } />;
		}

		const { behaviors: blockBehaviors } = props.attributes;

		// Get the theme behaviors from the theme.json.
		const themeBehaviors = select( blockEditorStore ).getBehaviors();

		// By default, use the block behaviors.
		// If the theme has behaviors, but the block does not, use the theme behaviors.
		const behaviors = blockBehaviors || themeBehaviors || {};

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="advanced">
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Behaviors' ) }
						// At the moment we are only supporting one behavior (lightbox)
						value={ behaviors?.lightbox ? 'LIGHTBOX' : '' }
						options={ Object.keys( behaviors )
							.map( ( behavior ) => ( {
								value: behavior,
								label: behavior.toUpperCase(),
							} ) )
							.concat( {
								value: '',
								label: __( 'No behavior' ),
							} ) }
						onChange={ ( nextValue ) => {
							// If the user selects something, it means that they want to
							// change the default value (true) so we save it in the attributes.
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
