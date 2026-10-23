import { useState, useId } from '@wordpress/element';
import {
	InspectorControls,
	store as blockEditorStore,
	useBlockBindingsUtils,
} from '@wordpress/block-editor';
import { BaseControl, Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../constants';
import {
	AllowOverridesModal,
	DisallowOverridesModal,
} from './allow-overrides-modal';
import type { PatternOverridesControlsProps } from './types';

function PatternOverridesControls( {
	attributes,
	setAttributes,
	name: blockName,
}: PatternOverridesControlsProps ) {
	const controlId = useId();
	const [ showAllowOverridesModal, setShowAllowOverridesModal ] =
		useState( false );
	const [ showDisallowOverridesModal, setShowDisallowOverridesModal ] =
		useState( false );

	// Blocks whose inner blocks can be bound are overridden as a whole, so
	// they bind their inner blocks rather than their attributes.
	const bindingKey = useSelect(
		( select ) =>
			(
				select( blockEditorStore ).getSettings()
					.__experimentalBlockBindingsSupportedAttributes as
					Record< string, string[] > | undefined
			 )?.[ blockName ]?.includes( 'innerBlocks' )
				? 'innerBlocks'
				: '__default',
		[ blockName ]
	);
	const hasName = !! attributes.metadata?.name;
	const defaultBindings = attributes.metadata?.bindings?.[ bindingKey ];
	const hasOverrides =
		hasName && defaultBindings?.source === PATTERN_OVERRIDES_BINDING_SOURCE;
	const isConnectedToOtherSources =
		defaultBindings?.source &&
		defaultBindings.source !== PATTERN_OVERRIDES_BINDING_SOURCE;
	const { updateBlockBindings } = useBlockBindingsUtils();

	function updateBindings( isChecked: boolean, customName?: string ) {
		if ( customName ) {
			setAttributes( {
				metadata: {
					...attributes.metadata,
					name: customName,
				},
			} );
		}

		updateBlockBindings( {
			[ bindingKey ]: isChecked
				? { source: PATTERN_OVERRIDES_BINDING_SOURCE }
				: undefined,
		} );
	}

	// Avoid overwriting other (e.g. meta) bindings.
	if ( isConnectedToOtherSources ) {
		return null;
	}

	const hasUnsupportedImageAttributes =
		blockName === 'core/image' && !! attributes.href?.length;

	const helpText =
		! hasOverrides && hasUnsupportedImageAttributes
			? __(
					`Overrides currently don't support image links. Remove the link first before enabling overrides.`
				)
			: __(
					'Allow changes to this block throughout instances of this pattern.'
				);

	return (
		<>
			<InspectorControls group="advanced">
				<BaseControl
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
