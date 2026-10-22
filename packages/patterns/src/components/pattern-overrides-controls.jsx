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

const INNER_BLOCKS = 'innerBlocks';

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
	const supportedAttributes = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalBlockBindingsSupportedAttributes?.[ blockName ],
		[ blockName ]
	);

	// `__default` only binds the attributes, so the inner blocks are bound on
	// their own.
	const canOverrideInnerBlocks =
		!! supportedAttributes?.includes( INNER_BLOCKS );
	const canOverrideAttributes =
		! canOverrideInnerBlocks ||
		supportedAttributes.some(
			( attributeName ) => attributeName !== INNER_BLOCKS
		);
	const hasName = !! attributes.metadata?.name;
	const defaultBindings = attributes.metadata?.bindings?.__default;
	const innerBlocksBindings = attributes.metadata?.bindings?.[ INNER_BLOCKS ];
	const hasOverrides =
		hasName &&
		[ defaultBindings, innerBlocksBindings ].some(
			( binding ) => binding?.source === PATTERN_OVERRIDES_BINDING_SOURCE
		);
	const isConnectedToOtherSources = [
		defaultBindings,
		innerBlocksBindings,
	].some(
		( binding ) =>
			binding?.source &&
			binding.source !== PATTERN_OVERRIDES_BINDING_SOURCE
	);
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

		const bindings = {};
		if ( isChecked ) {
			if ( canOverrideAttributes ) {
				bindings.__default = {
					source: PATTERN_OVERRIDES_BINDING_SOURCE,
				};
			}
			if ( canOverrideInnerBlocks ) {
				bindings[ INNER_BLOCKS ] = {
					source: PATTERN_OVERRIDES_BINDING_SOURCE,
				};
			}
		} else {
			// Only remove the existing bindings, as removing a missing one
			// would add it as `undefined`.
			if ( defaultBindings ) {
				bindings.__default = undefined;
			}
			if ( innerBlocksBindings ) {
				bindings[ INNER_BLOCKS ] = undefined;
			}
		}
		updateBlockBindings( bindings );
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
