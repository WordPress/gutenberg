/**
 * WordPress dependencies
 */
import { useState, useId } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { ToggleControl, BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
	PATTERN_OVERRIDES_BINDING_SOURCE,
} from '../constants';
import AllowOverridesModal from './allow-overrides-modal';

function removeBindings( bindings, syncedAttributes ) {
	let updatedBindings = {};
	for ( const attributeName of syncedAttributes ) {
		// Omit any bindings that's not the same source from the `updatedBindings` object.
		if (
			bindings?.[ attributeName ]?.source !==
				PATTERN_OVERRIDES_BINDING_SOURCE &&
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
				source: PATTERN_OVERRIDES_BINDING_SOURCE,
			};
		}
	}
	return updatedBindings;
}

function PatternOverridesControls( { attributes, name, setAttributes } ) {
	const controlId = useId();
	const [ showAllowOverridesModal, setShowAllowOverridesModal ] =
		useState( false );

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
			setShowAllowOverridesModal( true );
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

	const hasName = attributes.metadata?.name;

	return (
		<>
			<InspectorControls group="advanced">
				<BaseControl
					id={ controlId }
					label={ __( 'Overrides' ) }
					help={ __(
						'Allow attributes within this block to be overridden by pattern instances.'
					) }
				>
					{ hasName ? (
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Allow overrides' ) }
							checked={ attributeSources.some(
								( source ) =>
									source === PATTERN_OVERRIDES_BINDING_SOURCE
							) }
							onChange={ ( isChecked ) => {
								updateBindings( isChecked );
							} }
						/>
					) : (
						<Button
							className="pattern-overrides-control__allow-overrides-button"
							variant="secondary"
							onClick={ () => updateBindings( true ) }
						>
							{ __( 'Allow overrides' ) }
						</Button>
					) }
				</BaseControl>
			</InspectorControls>

			{ showAllowOverridesModal && (
				<AllowOverridesModal
					onClose={ () => setShowAllowOverridesModal( false ) }
					onSave={ ( newName ) => {
						updateBindings( true, newName );
					} }
				/>
			) }
		</>
	);
}

export default PatternOverridesControls;
