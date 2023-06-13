/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';

/**
 * External dependencies
 */
import merge from 'deepmerge';

function BehaviorsControl( {
	blockName,
	blockBehaviors,
	onChange,
	disabled = false,
} ) {
	const { settings, themeBehaviors } = useSelect(
		( select ) => {
			const { getBehaviors, getSettings } = select( blockEditorStore );

			return {
				settings:
					getSettings()?.__experimentalFeatures?.blocks?.[ blockName ]
						?.behaviors,
				themeBehaviors: getBehaviors()?.blocks?.[ blockName ],
			};
		},
		[ blockName ]
	);

	const noBehaviorsOption = {
		value: '',
		label: __( 'No behaviors' ),
	};

	const defaultBehaviorsOption = {
		value: 'default',
		label: __( 'Default' ),
	};

	const behaviorsOptions = Object.entries( settings )
		.filter(
			( [ behaviorName, behaviorValue ] ) =>
				hasBlockSupport( blockName, 'behaviors.' + behaviorName ) &&
				behaviorValue
		) // Filter out behaviors that are disabled.
		.map( ( [ behaviorName ] ) => ( {
			value: behaviorName,
			label:
				// Capitalize the first letter of the behavior name.
				behaviorName[ 0 ].toUpperCase() +
				behaviorName.slice( 1 ).toLowerCase(),
		} ) );

	// If every behavior is disabled, do not show the behaviors inspector control.
	if ( behaviorsOptions.length === 0 ) return null;

	const options = [
		defaultBehaviorsOption,
		noBehaviorsOption,
		...behaviorsOptions,
	];

	// Block behaviors take precedence over theme behaviors.
	const behaviors = merge( themeBehaviors, blockBehaviors || {} );

	const helpText = disabled
		? __( 'The lightbox behavior is disabled for linked images.' )
		: __( 'Add behaviors.' );

	return (
		<InspectorControls group="advanced">
			{ /* This div is needed to prevent a margin bottom between the dropdown and the button. */ }
			<SelectControl
				label={ __( 'Behaviors' ) }
				// At the moment we are only supporting one behavior (Lightbox)
				value={ behaviors?.lightbox ? 'lightbox' : '' }
				options={ options }
				onChange={ onChange }
				hideCancelButton={ true }
				help={ helpText }
				size="__unstable-large"
				disabled={ disabled }
			/>
		</InspectorControls>
	);
}

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
		const blockEdit = <BlockEdit key="edit" { ...props } />;
		// Only add behaviors to blocks with support.
		if ( ! hasBlockSupport( props.name, 'behaviors' ) ) {
			return blockEdit;
		}
		const blockHasLink =
			typeof props.attributes?.linkDestination !== 'undefined' &&
			props.attributes?.linkDestination !== 'none';
		return (
			<>
				{ blockEdit }
				<BehaviorsControl
					blockName={ props.name }
					blockBehaviors={ props.attributes.behaviors }
					onChange={ ( nextValue ) => {
						if ( nextValue === 'default' ) {
							props.setAttributes( {
								behaviors: undefined,
							} );
						} else {
							// If the user selects something, it means that they want to
							// change the default value (true) so we save it in the attributes.
							props.setAttributes( {
								behaviors: {
									lightbox: nextValue === 'lightbox',
								},
							} );
						}
					} }
					disabled={ blockHasLink }
				/>
			</>
		);
	};
}, 'withBehaviors' );

if ( window?.__experimentalInteractivityAPI ) {
	addFilter(
		'editor.BlockEdit',
		'core/behaviors/with-inspector-control',
		withBehaviors
	);
}
