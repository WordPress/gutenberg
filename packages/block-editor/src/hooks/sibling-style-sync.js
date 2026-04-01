/**
 * WordPress dependencies
 */
import { useLayoutEffect, useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { getBlockType, getBlockTypes } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { SiblingStyleSyncControl } from '../components/sibling-style-sync-control';
import { SiblingStyleSyncParentControl } from '../components/sibling-style-sync-control/parent-control';
import { partitionAttributesByGroups } from '../store/sibling-style-sync-utils';

/**
 * This HOC performs the following actions:
 *
 * - Intercepts `setAttributes` for blocks with `__experimentalSiblingStyleSync`
 *    support and routes updates through `__experimentalUpdateSyncedBlockAttributes`,
 *    which propagates style changes to all linked siblings within the sync scope.
 *
 * - On first mount, checks whether the block is freshly inserted (no synced
 *    styles of its own). If so, it inherits the canonical style from the first
 *    linked sibling without creating a separate undo level — the style
 *    initialisation is silently folded into the insert's undo entry via
 *    `__unstableMarkNextChangeAsNotPersistent`.
 *
 * Blocks without the support are passed through unchanged.
 */
const withSiblingStyleSync = createHigherOrderComponent(
	( BlockEdit ) =>
		function SiblingStyleSyncWrapper( props ) {
			const { clientId, name, setAttributes } = props;

			const syncSupport =
				getBlockType( name )?.supports?.__experimentalSiblingStyleSync;

			const registry = useRegistry();

			const {
				__experimentalUpdateSyncedBlockAttributes,
				__experimentalUnlinkBlockStyleSync,
			} = unlock( useDispatch( blockEditorStore ) );

			const wrappedSetAttributes = useMemo( () => {
				if ( ! syncSupport ) {
					return setAttributes;
				}
				return ( newAttributes ) =>
					__experimentalUpdateSyncedBlockAttributes(
						clientId,
						newAttributes
					);
			}, [
				clientId,
				syncSupport,
				setAttributes,
				__experimentalUpdateSyncedBlockAttributes,
			] );

			// On first mount, inherit canonical styles if block is fresh.
			//
			// This runs synchronously before paint (useLayoutEffect) so the
			// block is never visible in an unstyled state.
			//
			// Intentionally passing an empty deps array: clientId and name are
			// stable for a given block instance, and we only want this to run
			// once — on the initial mount of a newly inserted block.
			useLayoutEffect( () => {
				if ( ! syncSupport ) {
					return;
				}

				const storeSelect = registry.select( blockEditorStore );

				// Skip if the block already has its own synced styles (loaded from saved content or previously styled by the user).
				const currentAttrs = storeSelect.getBlockAttributes( clientId );
				if ( ! currentAttrs ) {
					return;
				}

				// Restore unlink state from persisted attribute on page reload.
				if ( currentAttrs.styleSyncUnlinked ) {
					const privateSelect = unlock(
						registry.select( blockEditorStore )
					);
					const scopeId =
						privateSelect.__experimentalGetSiblingStyleSyncScopeClientId(
							clientId,
							name
						);
					if ( scopeId ) {
						__experimentalUnlinkBlockStyleSync(
							clientId,
							name,
							scopeId
						);
					}
					return;
				}
				const { syncedAttributes: ownStyles } =
					partitionAttributesByGroups( currentAttrs );
				const hasOwnStyles = Object.values( ownStyles ).some(
					( v ) => v !== undefined && v !== null
				);
				if ( hasOwnStyles ) {
					return;
				}

				// Respect the parent scope's sync toggle.
				const privateSelect = unlock(
					registry.select( blockEditorStore )
				);
				const scopeClientId =
					privateSelect.__experimentalGetSiblingStyleSyncScopeClientId(
						clientId,
						name
					);
				const syncDescendantStyles = scopeClientId
					? storeSelect.getBlockAttributes( scopeClientId )
							?.syncDescendantStyles ?? {}
					: {};
				if ( syncDescendantStyles[ name ] === false ) {
					return;
				}

				// Find the first linked sibling that has styles to copy from.
				const siblings =
					privateSelect.__experimentalGetSiblingStyleSyncBlocks(
						clientId,
						name
					);
				const canonicalSibling = siblings.find(
					( s ) =>
						! privateSelect.__experimentalIsBlockStyleSyncUnlinked(
							s.clientId,
							name
						)
				);
				if ( ! canonicalSibling ) {
					return;
				}

				const canonicalAttrs = storeSelect.getBlockAttributes(
					canonicalSibling.clientId
				);
				const { syncedAttributes } =
					partitionAttributesByGroups( canonicalAttrs );
				if ( Object.keys( syncedAttributes ).length === 0 ) {
					return;
				}

				// Apply without creating a new undo level.
				const storeDispatch = registry.dispatch( blockEditorStore );
				storeDispatch.__unstableMarkNextChangeAsNotPersistent();
				storeDispatch.updateBlockAttributes(
					clientId,
					syncedAttributes
				);
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [] );

			return (
				<>
					<BlockEdit
						{ ...props }
						setAttributes={ wrappedSetAttributes }
					/>
					{ syncSupport && (
						<SiblingStyleSyncControl
							clientId={ clientId }
							name={ name }
						/>
					) }
				</>
			);
		},
	'withSiblingStyleSync'
);

addFilter(
	'editor.BlockEdit',
	'core/sibling-style-sync/wrap-set-attributes',
	withSiblingStyleSync,
	// Priority 20 (higher than createBlockEditFilter's default of 10) ensures
	// this HOC is outermost. Inspector panel HOCs (color, typography, border,
	// spacing) all run at priority 10 and pass setAttributes via {...props}.
	20
);

/**
 * Higher-order component that injects `SiblingStyleSyncParentControl` into the
 * inspector of blocks that act as a sync scope (i.e. blocks that are declared
 * as the `scope` in at least one child block type's sync support).
 */
const withSiblingStyleSyncParent = createHigherOrderComponent(
	( BlockEdit ) =>
		function SiblingStyleSyncParentWrapper( props ) {
			const { name } = props;
			const isScope = useMemo(
				() =>
					getBlockTypes().some(
						( type ) =>
							type.supports?.__experimentalSiblingStyleSync
								?.scope === name
					),
				[ name ]
			);

			return (
				<>
					<BlockEdit { ...props } />
					{ isScope && (
						<SiblingStyleSyncParentControl { ...props } />
					) }
				</>
			);
		},
	'withSiblingStyleSyncParent'
);

addFilter(
	'editor.BlockEdit',
	'core/sibling-style-sync/parent-control',
	withSiblingStyleSyncParent
);

/**
 * Automatically injects the `styleSyncUnlinked` attribute onto any block type
 * that declares `__experimentalSiblingStyleSync` support. This persists the
 * per-block unlink state across page reloads without requiring each synced
 * block to manually add the attribute to its block.json.
 *
 * @param {Object} settings Block type settings.
 * @return {Object} Possibly-modified settings.
 */
function addStyleSyncUnlinkedAttribute( settings ) {
	if ( ! settings.supports?.__experimentalSiblingStyleSync ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			styleSyncUnlinked: {
				type: 'boolean',
				default: false,
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/sibling-style-sync/add-style-sync-unlinked-attribute',
	addStyleSyncUnlinkedAttribute
);
