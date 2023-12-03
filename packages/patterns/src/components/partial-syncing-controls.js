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

	function updateBindings( attributeName, isChecked ) {
		if ( ! isChecked ) {
			// Update the bindings property.
			updateBlockBindingsAttribute(
				attributes,
				setAttributes,
				attributeName,
				null,
				null
			);
			return;
		}

		if ( typeof attributes.metadata?.id === 'string' ) {
			updateBlockBindingsAttribute(
				attributes,
				setAttributes,
				attributeName,
				'pattern_attributes',
				null
			);
			return;
		}

		const id = nanoid( 6 );
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
								attributes?.metadata?.bindings?.[
									attributeName
								]?.source_id === 'pattern_attributes'
							}
							onChange={ ( isChecked ) => {
								// TODO: REVIEW WHY THE CHECKED IS NOT UPDATED.
								// The attributes are updated but the checkbox is not.
								// It works fine when I switch from Visual Editor -> Code Editor -> Visual Editor.
								updateBindings( attributeName, isChecked );
							} }
						/>
					)
				) }
			</BaseControl>
		</InspectorControls>
	);
}

export default PartialSyncingControls;
