/**
 * External dependencies
 */
import { nanoid } from 'nanoid';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	updateBlockBindingsAttribute,
} from '@wordpress/block-editor';
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
			attributes.metadata?.bindings?.[ attributeName ]?.source?.name
	);
	const isConnectedToOtherSources = attributeSources.every(
		( source ) => source && source !== 'pattern_attributes'
	);

	// Render nothing if all supported attributes are connected to other sources.
	if ( isConnectedToOtherSources ) {
		return null;
	}

	function updateBindings( isChecked ) {
		if ( ! isChecked ) {
			for ( const attributeName of Object.keys( syncedAttributes ) ) {
				updateBlockBindingsAttribute(
					attributes,
					setAttributes,
					attributeName,
					null,
					null
				);
			}
			return;
		}

		if ( typeof attributes.metadata?.id === 'string' ) {
			for ( const attributeName of Object.keys( syncedAttributes ) ) {
				updateBlockBindingsAttribute(
					attributes,
					setAttributes,
					attributeName,
					'pattern_attributes',
					null
				);
			}
			return;
		}

		const id = nanoid( 6 );
		for ( const attributeName of Object.keys( syncedAttributes ) ) {
			const newMetadata = updateBlockBindingsAttribute(
				attributes,
				setAttributes,
				attributeName,
				'pattern_attributes',
				null
			);

			setAttributes( {
				metadata: {
					...newMetadata,
					id,
				},
			} );
		}
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
						( source ) => source === 'pattern_attributes'
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
