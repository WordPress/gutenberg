/**
 * External dependencies
 */
import { nanoid } from 'nanoid';

/**
 * WordPress dependencies
 */
import { BaseControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';

function PartialSyncingControls( { attributes, setAttributes } ) {
	// Only the `content` attribute of the paragraph block is currently supported.
	const attributeName = 'content';

	const isPartiallySynced =
		attributes.connections?.attributes?.[ attributeName ]?.source ===
		'pattern_attributes';

	function updateConnections( isChecked ) {
		if ( ! isChecked ) {
			setAttributes( {
				connections: undefined,
			} );
			return;
		}
		if ( typeof attributes.metadata?.id === 'string' ) {
			setAttributes( {
				connections: {
					attributes: {
						[ attributeName ]: {
							source: 'pattern_attributes',
						},
					},
				},
			} );
			return;
		}

		const id = nanoid( 6 );
		setAttributes( {
			connections: {
				attributes: {
					[ attributeName ]: { source: 'pattern_attributes' },
				},
			},
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
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Content' ) }
					checked={ isPartiallySynced }
					onChange={ ( isChecked ) => {
						updateConnections( isChecked );
					} }
				/>
			</BaseControl>
		</InspectorControls>
	);
}

export default PartialSyncingControls;
