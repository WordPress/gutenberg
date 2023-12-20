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

	function updateBindings( attributeName, isChecked ) {
		if ( ! isChecked ) {
			let updatedBindings = {
				...attributes?.metadata?.bindings,
				[ attributeName ]: undefined,
			};
			if ( Object.keys( updatedBindings ).length === 1 ) {
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

		const updatedBindings = {
			...attributes?.metadata?.bindings,
			[ attributeName ]: { source: { name: 'pattern_attributes' } },
		};

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
								]?.source?.name === 'pattern_attributes'
							}
							onChange={ ( isChecked ) => {
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
