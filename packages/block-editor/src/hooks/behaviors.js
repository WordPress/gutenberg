/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { TextControl } from '@wordpress/components';
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
		const { behaviors: blockBehaviors } = props.attributes;
		const settings = select( blockEditorStore ).getSettings();
		const themeBehaviors =
			settings?.__experimentalFeatures?.blocks?.[ 'core/image' ]
				.behaviors;

		if ( ! blockBehaviors && ! themeBehaviors ) {
			return <BlockEdit { ...props } />;
		}

		if ( ! blockBehaviors && themeBehaviors ) {
			props.attributes.behaviors = themeBehaviors;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls group="advanced">
					<TextControl
						__nextHasNoMarginBottom
						autoComplete="on"
						label={ __( 'Behaviors' ) }
						value={
							props.attributes?.behaviors?.lightbox
								? 'LIGHTBOX'
								: ''
						}
						onChange={ ( nextValue ) => {
							props.setAttributes( {
								behaviors:
									nextValue !== '' ? nextValue : undefined,
							} );
						} }
						help={ __( 'Add behaviors' ) }
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
