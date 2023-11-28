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

	function updateConnections( attributeName, isChecked ) {
		if ( ! isChecked ) {
			let updatedConnections = {
				...attributes.connections,
				attributes: {
					...attributes.connections?.attributes,
					[ attributeName ]: undefined,
				},
			};
			if ( Object.keys( updatedConnections.attributes ).length === 1 ) {
				updatedConnections.attributes = undefined;
			}
			if (
				Object.keys( updatedConnections ).length === 1 &&
				updateConnections.attributes === undefined
			) {
				updatedConnections = undefined;
			}
			setAttributes( {
				connections: updatedConnections,
			} );
			return;
		}

		const updatedConnections = {
			...attributes.connections,
			attributes: {
				...attributes.connections?.attributes,
				[ attributeName ]: {
					source: 'pattern_attributes',
				},
			},
		};

		if ( typeof attributes.metadata?.id === 'string' ) {
			setAttributes( { connections: updatedConnections } );
			return;
		}

		const id = nanoid( 6 );
		setAttributes( {
			connections: updatedConnections,
			metadata: {
				...attributes.metadata,
				id,
			},
		} );
	}

	return (
		<InspectorControls group="advanced">
			<BaseControl __nextHasNoMarginBottom>
				<BaseControl.VisualLabel>
					{ __( 'Synced attributes' ) }
				</BaseControl.VisualLabel>
				{ Object.entries( syncedAttributes ).map(
					( [ attributeName, label ] ) => (
						<CheckboxControl
							key={ attributeName }
							__nextHasNoMarginBottom
							label={ label }
							checked={
								attributes.connections?.attributes?.[
									attributeName
								]?.source === 'pattern_attributes'
							}
							onChange={ ( isChecked ) => {
								updateConnections( attributeName, isChecked );
							} }
						/>
					)
				) }
			</BaseControl>
		</InspectorControls>
	);
}

export default PartialSyncingControls;
