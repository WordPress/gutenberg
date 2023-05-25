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
 * External dependencies
 */
import merge from 'deepmerge';

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

		const settings =
			select( blockEditorStore ).getSettings()?.__experimentalFeatures
				?.blocks?.[ props.name ]?.behaviors;

		if (
			! settings ||
			// If every behavior is disabled, do not show the behaviors inspector control.
			Object.entries( settings ).every( ( [ , value ] ) => ! value )
		) {
			return <BlockEdit { ...props } />;
		}

		const { behaviors: blockBehaviors } = props.attributes;

		// Get the theme behaviors for the block from the theme.json.
		const themeBehaviors =
			select( blockEditorStore ).getBehaviors()?.blocks?.[ props.name ];

		// Block behaviors take precedence over theme behaviors.
		const behaviors = merge( themeBehaviors, blockBehaviors || {} );

		const noBehaviorsOption = {
			value: '',
			label: __( 'No behaviors' ),
		};

		const behaviorsOptions = Object.entries( settings )
			.filter( ( [ , behaviorValue ] ) => behaviorValue ) // Filter out behaviors that are disabled.
			.map( ( [ behaviorName ] ) => ( {
				value: behaviorName,
				label:
					// Capitalize the first letter of the behavior name.
					behaviorName[ 0 ].toUpperCase() +
					behaviorName.slice( 1 ).toLowerCase(),
			} ) );

		const options = [ noBehaviorsOption, ...behaviorsOptions ];

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="advanced">
					<SelectControl
						__nextHasNoMarginBottom
						label={ __( 'Behaviors' ) }
						// At the moment we are only supporting one behavior (Lightbox)
						value={ behaviors?.lightbox ? 'lightbox' : '' }
						options={ options }
						onChange={ ( nextValue ) => {
							// If the user selects something, it means that they want to
							// change the default value (true) so we save it in the attributes.
							props.setAttributes( {
								behaviors: {
									lightbox: nextValue === 'lightbox',
								},
							} );
						} }
						hideCancelButton={ true }
						help={ __( 'Add behaviors.' ) }
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
