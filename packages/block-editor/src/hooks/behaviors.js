/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom class name, if block supports custom class name.
 * The control is displayed within the Advanced panel in the block inspector.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const { behaviors } = props.attributes;
			const { behaviors: behaviorsSupport } = props.blockType.attributes;

			const settings = useSettings();

			// eslint-disable-next-line no-console
			console.log( 'behaviors', behaviors );
			// eslint-disable-next-line no-console
			console.log( 'behaviorsSupport', behaviorsSupport );
			// eslint-disable-next-line no-console
			console.log( settings );

			return (
				<>
					<BlockEdit { ...props } />
					<InspectorControls group="advanced">
						<TextControl
							__nextHasNoMarginBottom
							autoComplete="on"
							label={ __( 'Behaviors' ) }
							value={ props.attributes.behaviors || '' }
							onChange={ ( nextValue ) => {
								props.setAttributes( {
									behaviors:
										nextValue !== ''
											? nextValue
											: undefined,
								} );
							} }
							help={ __( 'Add behaviors' ) }
						/>
					</InspectorControls>
				</>
			);
		};
	},
	'withInspectorControl'
);

addFilter(
	'editor.BlockEdit',
	'core/behaviors/with-inspector-control',
	withInspectorControl
);
