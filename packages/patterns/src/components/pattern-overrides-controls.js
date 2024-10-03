/**
 * WordPress dependencies
 */
import { useState, useId } from '@wordpress/element';
import {
	InspectorControls,
	useBlockBindingsUtils,
} from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../constants';
import {
	AllowOverridesModal,
	DisallowOverridesModal,
} from './allow-overrides-modal';

function PatternOverridesControls( {
	attributes,
	setAttributes,
	name: blockName,
} ) {
	const controlId = useId();
	const [ showAllowOverridesModal, setShowAllowOverridesModal ] =
		useState( false );
	const [ showDisallowOverridesModal, setShowDisallowOverridesModal ] =
		useState( false );

	const hasName = !! attributes.metadata?.name;
	const defaultBindings = attributes.metadata?.bindings?.__default;
	const hasOverrides =
		hasName && defaultBindings?.source === PATTERN_OVERRIDES_BINDING_SOURCE;
	const isConnectedToOtherSources =
		defaultBindings?.source &&
		defaultBindings.source !== PATTERN_OVERRIDES_BINDING_SOURCE;
	const { updateBlockBindings } = useBlockBindingsUtils();

	function updateBindings( isChecked, customName ) {
		if ( customName ) {
			setAttributes( {
				metadata: {
					...attributes.metadata,
					name: customName,
				},
			} );
		}

		updateBlockBindings( {
			__default: isChecked
				? { source: PATTERN_OVERRIDES_BINDING_SOURCE }
				: undefined,
		} );
	}

	// Avoid overwriting other (e.g. meta) bindings.
	if ( isConnectedToOtherSources ) {
		return null;
	}

	const hasUnsupportedImageAttributes =
		blockName === 'core/image' &&
		( !! attributes.caption?.length || !! attributes.href?.length );

	const helpText =
		! hasOverrides && hasUnsupportedImageAttributes
			? __(
					`Overrides currently don't support image captions or links. Remove the caption or link first before enabling overrides.`
			  )
			: __(
					'Allow changes to this block throughout instances of this pattern.'
			  );

	return (
		<>
			<InspectorControls group="advanced">
				<BaseControl
					__nextHasNoMarginBottom
					id={ controlId }
					label={ __( 'Overrides' ) }
					help={ helpText }
				>
					<Button
						__next40pxDefaultSize
						className="pattern-overrides-control__allow-overrides-button"
						variant="secondary"
						aria-haspopup="dialog"
						onClick={ () => {
							if ( hasOverrides ) {
								setShowDisallowOverridesModal( true );
							} else {
								setShowAllowOverridesModal( true );
							}
						} }
						disabled={
							! hasOverrides && hasUnsupportedImageAttributes
						}
						accessibleWhenDisabled
					>
						{ hasOverrides
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
