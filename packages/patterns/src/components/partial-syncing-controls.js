/**
 * External dependencies
 */
import { nanoid } from 'nanoid';

/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { BaseControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';

function PartialSyncingControls( { name, attributes, setAttributes } ) {
	const syncedAttributes = PARTIAL_SYNCING_SUPPORTED_BLOCKS[ name ];
	const attributeSources = Object.keys( syncedAttributes ).map(
		( attributeName ) =>
			attributes.metadata?.bindings?.[ attributeName ]?.source
	);
	const isConnectedToOtherSources = attributeSources.every(
		( source ) => source && source !== 'core/pattern-overrides'
	);

	// Render nothing if all supported attributes are connected to other sources.
	if ( isConnectedToOtherSources ) {
		return null;
	}

	function updateBindings( isChecked ) {
		let updatedBindings = {
			...attributes?.metadata?.bindings,
		};

		if ( ! isChecked ) {
			for ( const attributeName of Object.keys( syncedAttributes ) ) {
				if (
					updatedBindings[ attributeName ]?.source ===
					'core/pattern-overrides'
				) {
					delete updatedBindings[ attributeName ];
				}
			}
			if ( ! Object.keys( updatedBindings ).length ) {
				updatedBindings = undefined;
			}
			setAttributes( {
				metadata: {
					...attributes.metadata,
					bindings: updatedBindings,
				},
			} );
			return;
		}

		for ( const attributeName of Object.keys( syncedAttributes ) ) {
			if ( ! updatedBindings[ attributeName ] ) {
				updatedBindings[ attributeName ] = {
					source: 'core/pattern-overrides',
				};
			}
		}

		if ( typeof attributes.metadata?.id === 'string' ) {
			setAttributes( {
				metadata: {
					...attributes.metadata,
					bindings: updatedBindings,
				},
			} );
			return;
		}

		const id = nanoid( 6 );
		setAttributes( {
			metadata: {
				...attributes.metadata,
				id,
				bindings: updatedBindings,
			},
		} );
	}

	return (
		<InspectorControls group="advanced">
			<BaseControl __nextHasNoMarginBottom>
				<BaseControl.VisualLabel>
					{ __( 'Pattern overrides' ) }
				</BaseControl.VisualLabel>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Allow instance overrides' ) }
					checked={ attributeSources.some(
						( source ) => source === 'core/pattern-overrides'
					) }
					onChange={ ( isChecked ) => {
						updateBindings( isChecked );
					} }
				/>
			</BaseControl>
		</InspectorControls>
	);
}

export default PartialSyncingControls;
