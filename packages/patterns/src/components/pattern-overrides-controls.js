/**
 * WordPress dependencies
 */
import { useState, useId } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
	PATTERN_OVERRIDES_BINDING_SOURCE,
} from '../constants';
import {
	AllowOverridesModal,
	DisallowOverridesModal,
} from './allow-overrides-modal';

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
	const [ showDisallowOverridesModal, setShowDisallowOverridesModal ] =
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
	if ( isConnectedToOtherSources ) {
		return null;
	}

	const hasName = !! attributes.metadata?.name;
	const allowOverrides =
		hasName &&
		attributeSources.some(
			( source ) => source === PATTERN_OVERRIDES_BINDING_SOURCE
		);

	return (
		<>
			<InspectorControls group="advanced">
				<BaseControl
					id={ controlId }
					label={ __( 'Overrides' ) }
					help={ __(
						'Allow changes to this block throughout instances of this pattern.'
					) }
				>
					<Button
						__next40pxDefaultSize
						className="pattern-overrides-control__allow-overrides-button"
						variant="secondary"
						aria-haspopup="dialog"
						onClick={ () => {
							if ( allowOverrides ) {
								setShowDisallowOverridesModal( true );
							} else {
								setShowAllowOverridesModal( true );
							}
						} }
					>
						{ allowOverrides
							? __( 'Disable overrides' )
							: __( 'Enable overrides' ) }
					</Button>
				</BaseControl>
			</InspectorControls>

			{ showAllowOverridesModal && (
				<AllowOverridesModal
					initialName={ attributes.metadata?.name }
					onClose={ () => setShowAllowOverridesModal( false ) }
					onSave={ ( newName ) => {
						updateBindings( true, newName );
					} }
				/>
			) }
			{ showDisallowOverridesModal && (
				<DisallowOverridesModal
					onClose={ () => setShowDisallowOverridesModal( false ) }
					onSave={ () => updateBindings( false ) }
				/>
			) }
		</>
	);
}

export default PatternOverridesControls;
