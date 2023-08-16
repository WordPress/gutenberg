/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { InspectorControls } from '../components';

function BehaviorsControl( {
	blockName,
	blockBehaviors,
	onChangeBehavior,
	onChangeAnimation,
	disabled = false,
} ) {
	const { settings } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			return {
				settings:
					getSettings()?.__experimentalFeatures?.blocks?.[ blockName ]
						?.behaviors || {},
			};
		},
		[ blockName ]
	);

	const defaultBehaviors = {
		default: {
			value: 'default',
			label: __( 'Default' ),
		},
		noBehaviors: {
			value: '',
			label: __( 'No behaviors' ),
		},
	};
	const behaviorsOptions = Object.entries( settings )
		.filter(
			( [ behaviorName, behaviorValue ] ) =>
				hasBlockSupport( blockName, `behaviors.${ behaviorName }` ) &&
				behaviorValue
		) // Filter out behaviors that are disabled.
		.map( ( [ behaviorName ] ) => ( {
			value: behaviorName,
			// Capitalize the first letter of the behavior name.
			label: `${ behaviorName.charAt( 0 ).toUpperCase() }${ behaviorName
				.slice( 1 )
				.toLowerCase() }`,
		} ) );
	const options = [
		...Object.values( defaultBehaviors ),
		...behaviorsOptions,
	];

	const { behaviors, behaviorsValue } = useMemo( () => {
		const mergedBehaviors = {
			...( blockBehaviors || {} ),
		};

		let value = '';
		if ( blockBehaviors === undefined ) {
			value = 'default';
		} else {
			for ( const [ behavior, object ] of Object.entries(
				blockBehaviors
			) ) {
				if ( object.enabled ) {
					value = behavior;
				}
			}
		}
		return {
			behaviors: mergedBehaviors,
			behaviorsValue: value,
		};
	}, [ blockBehaviors ] );

	// If every behavior is disabled, do not show the behaviors inspector control.
	if ( behaviorsOptions.length === 0 ) {
		return null;
	}

	const helpText = disabled
		? __( 'The lightbox behavior is disabled for linked images.' )
		: '';

	return (
		<InspectorControls group="advanced">
			<div>
				<SelectControl
					label={ __( 'Behaviors' ) }
					// At the moment we are only supporting one behavior (Lightbox)
					value={ behaviorsValue }
					options={ options }
					onChange={ onChangeBehavior }
					hideCancelButton={ true }
					help={ helpText }
					size="__unstable-large"
					disabled={ disabled }
				/>
				{ behaviorsValue === 'lightbox' && (
					<SelectControl
						label={ __( 'Animation' ) }
						// At the moment we are only supporting one behavior (Lightbox)
						value={
							behaviors?.lightbox.animation
								? behaviors?.lightbox.animation
								: ''
						}
						options={ [
							{
								value: 'zoom',
								label: __( 'Zoom' ),
							},
							{
								value: 'fade',
								label: __( 'Fade' ),
							},
						] }
						onChange={ onChangeAnimation }
						hideCancelButton={ false }
						size="__unstable-large"
						disabled={ disabled }
					/>
				) }
			</div>
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
					onChangeBehavior={ ( nextValue ) => {
						switch ( nextValue ) {
							case 'default':
								props.setAttributes( {
									behaviors: undefined,
								} );
								break;
							// If the user selects something, it means that they want to
							// change the default value (true) so we save it in the attributes.
							case 'lightbox':
								props.setAttributes( {
									behaviors: {
										lightbox: {
											enabled: true,
											animation: 'zoom',
										},
									},
								} );
								break;
							case 'showInView':
								props.setAttributes( {
									behaviors: {
										showInView: {
											enabled: true,
											animation: 'vertical',
										},
									},
								} );
								break;
							case '':
								props.setAttributes( {
									behaviors: {
										lightbox: {
											enabled: false,
											animation: '',
										},
										showInView: {
											enabled: false,
											animation: '',
										},
									},
								} );
								break;
						}
					} }
					onChangeAnimation={ ( nextValue ) => {
						props.setAttributes( {
							behaviors: {
								lightbox: {
									enabled:
										props.attributes.behaviors.lightbox
											.enabled,
									animation: nextValue,
								},
							},
						} );
					} }
					disabled={ blockHasLink }
				/>
			</>
		);
	};
}, 'withBehaviors' );

addFilter(
	'editor.BlockEdit',
	'core/behaviors/with-inspector-control',
	withBehaviors
);
