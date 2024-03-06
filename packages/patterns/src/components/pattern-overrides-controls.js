/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InspectorControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { BaseControl, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';
import { unlock } from '../lock-unlock';

const { BlockRenameModal } = unlock( blockEditorPrivateApis );

function removeBindings( bindings, syncedAttributes ) {
	let updatedBindings = {};
	for ( const attributeName of syncedAttributes ) {
		// Omit any pattern override bindings from the `updatedBindings` object.
		if (
			bindings?.[ attributeName ]?.source !== 'core/pattern-overrides' &&
			bindings?.[ attributeName ]?.source !== undefined
		) {
			updatedBindings[ attributeName ] = bindings[ attributeName ];
		}
	}
	if ( ! Object.keys( updatedBindings ).length ) {
		updatedBindings = undefined;
	}
	return updatedBindings;
}

function addBindings( bindings, syncedAttributes ) {
	const updatedBindings = { ...bindings };
	for ( const attributeName of syncedAttributes ) {
		if ( ! bindings?.[ attributeName ] ) {
			updatedBindings[ attributeName ] = {
				source: 'core/pattern-overrides',
			};
		}
	}
	return updatedBindings;
}

function PatternOverridesControls( { attributes, name, setAttributes } ) {
	const [ showBlockNameModal, setShowBlockNameModal ] = useState( false );

	const syncedAttributes = PARTIAL_SYNCING_SUPPORTED_BLOCKS[ name ];
	const attributeSources = syncedAttributes.map(
		( attributeName ) =>
			attributes.metadata?.bindings?.[ attributeName ]?.source
	);
	const isConnectedToOtherSources = attributeSources.every(
		( source ) => source && source !== 'core/pattern-overrides'
	);

	function updateBindings( isChecked, customName ) {
		if ( isChecked && ! attributes.metadata?.name && ! customName ) {
			setShowBlockNameModal( true );
			return;
		}

		const prevBindings = attributes?.metadata?.bindings;
		const updatedBindings = isChecked
			? addBindings( prevBindings, syncedAttributes )
			: removeBindings( prevBindings, syncedAttributes );

		const updatedMetadata = {
			...attributes.metadata,
			bindings: updatedBindings,
		};

		if ( customName ) {
			updatedMetadata.name = customName;
		}

		setAttributes( {
			metadata: updatedMetadata,
		} );
	}

	// Avoid overwriting other (e.g. meta) bindings.
	if ( isConnectedToOtherSources ) return null;

	return (
		<>
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

			{ showBlockNameModal && (
				<BlockRenameModal
					blockName={ attributes.metadata?.name || '' }
					onClose={ () => setShowBlockNameModal( false ) }
					onSave={ ( newName ) => {
						updateBindings( true, newName );
					} }
				/>
			) }
		</>
	);
}

export default PatternOverridesControls;
