/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { createHigherOrderComponent } from '@wordpress/compose';
import {
	useBlockEditingMode,
	InspectorControls,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { CheckboxControl } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';
import { unlock } from '../lock-unlock';

const {
	useSetPatternBindings,
	ResetOverridesControl,
	PATTERN_TYPES,
	PARTIAL_SYNCING_SUPPORTED_BLOCKS,
} = unlock( patternsPrivateApis );

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning a partial syncing controls to supported blocks in the pattern editor.
 * Currently, only the following `core` namespaced blocks are supported:
 * - Paragraph
 * - Heading
 * - Image
 * - Button
 *
 * @param {Component} BlockEdit Original component.
 *
 * @return {Component} Wrapped component.
 */
const withPatternOverrideControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const isSupportedBlock = Object.keys(
			PARTIAL_SYNCING_SUPPORTED_BLOCKS
		).includes( props.name );

		return (
			<>
				<BlockEdit { ...props } />
				{ isSupportedBlock && <BindingUpdater { ...props } /> }
				{ props.isSelected && isSupportedBlock && (
					<BindingsResetControl { ...props } />
				) }
				{ props.isSelected && isSupportedBlock && (
					<ControlsWithStoreSubscription { ...props } />
				) }
			</>
		);
	}
);

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

function BindingsResetControl( { name, attributes, setAttributes } ) {
	const blockEditingMode = useBlockEditingMode();
	const isEditingPattern = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === PATTERN_TYPES.user,
		[]
	);

	const metadata = attributes?.metadata;
	const bindings = metadata?.bindings;

	const syncedAttributes = PARTIAL_SYNCING_SUPPORTED_BLOCKS[ name ];
	const shouldShowResetRemoveBindingsControl =
		isEditingPattern &&
		!! metadata?.name &&
		blockEditingMode !== 'disabled';

	if ( ! shouldShowResetRemoveBindingsControl ) {
		return null;
	}

	// If one of the syncedAttributes is in the bindings, then we should show the reset control.
	const hasBindings = syncedAttributes.some(
		( attributeName ) => bindings?.[ attributeName ]
	);

	const attributeCount = syncedAttributes.length;
	const helpText = sprintf(
		// Translators: %1$s is a list of attributes, %2$s is the count of attributes.
		__( 'Disables overrides on the %1$s %2$s on a per instance basis.' ),
		syncedAttributes.join( ', ' ),
		_n( 'attribute', 'attributes', attributeCount )
	);

	return (
		<InspectorControls group="advanced">
			<CheckboxControl
				label={ __( 'Disable instance overides' ) }
				checked={ ! hasBindings }
				onChange={ ( isChecked ) => {
					if ( isChecked ) {
						const updatedBindings = removeBindings(
							bindings,
							syncedAttributes
						);
						setAttributes( {
							metadata: {
								...attributes.metadata,
								bindings: updatedBindings,
							},
						} );
					} else if ( attributes.metadata.name ) {
						const updatedBindings = addBindings(
							bindings,
							syncedAttributes
						);
						setAttributes( {
							metadata: {
								...attributes.metadata,
								bindings: updatedBindings,
							},
						} );
					}
				} }
				help={ helpText }
			/>
		</InspectorControls>
	);
}

function BindingUpdater( props ) {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	useSetPatternBindings( props, postType );
	return null;
}

// Split into a separate component to avoid a store subscription
// on every block.
function ControlsWithStoreSubscription( props ) {
	const blockEditingMode = useBlockEditingMode();
	const isEditingPattern = useSelect(
		( select ) =>
			select( editorStore ).getCurrentPostType() === PATTERN_TYPES.user,
		[]
	);

	const bindings = props.attributes.metadata?.bindings;
	const hasPatternBindings =
		!! bindings &&
		Object.values( bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		);

	const shouldShowResetOverridesControl =
		! isEditingPattern &&
		!! props.attributes.metadata?.name &&
		blockEditingMode !== 'disabled' &&
		hasPatternBindings;

	return (
		<>
			{ shouldShowResetOverridesControl && (
				<ResetOverridesControl { ...props } />
			) }
		</>
	);
}

addFilter(
	'editor.BlockEdit',
	'core/editor/with-pattern-override-controls',
	withPatternOverrideControls
);
