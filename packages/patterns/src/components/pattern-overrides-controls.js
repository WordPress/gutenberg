/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	InspectorControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { addBindings } from './use-set-pattern-bindings';
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';
import { unlock } from '../lock-unlock';

const { BlockRenameModal } = unlock( blockEditorPrivateApis );

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
			: // Explicitly set to false to disable pattern overrides.
			  false;

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
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Allow pattern overrides' ) }
					checked={ attributeSources.some(
						( source ) => source === 'core/pattern-overrides'
					) }
					help={ __(
						'Allow attributes within this block to be overridden by pattern instances.'
					) }
					onChange={ ( isChecked ) => {
						updateBindings( isChecked );
					} }
				/>
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
