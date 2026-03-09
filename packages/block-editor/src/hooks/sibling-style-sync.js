/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { getBlockType, getBlockTypes } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { SiblingStyleSyncControl } from '../components/sibling-style-sync-control';
import { SiblingStyleSyncParentControl } from '../components/sibling-style-sync-control/parent-control';

/**
 * Higher-order component that intercepts `setAttributes` for blocks that
 * declare `__experimentalSiblingStyleSync` support and routes attribute
 * updates through `__experimentalUpdateSyncedBlockAttributes`, which
 * propagates style changes to linked sibling blocks within the sync scope.
 *
 * Blocks that do not declare the support are passed through unchanged.
 */
const withSiblingStyleSync = createHigherOrderComponent(
	( BlockEdit ) =>
		function SiblingStyleSyncWrapper( props ) {
			const { clientId, name, setAttributes } = props;

			const syncSupport =
				getBlockType( name )?.supports?.__experimentalSiblingStyleSync;

			const { __experimentalUpdateSyncedBlockAttributes } = unlock(
				useDispatch( blockEditorStore )
			);

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
	// Priority 5 ensures this wraps early, so the intercepted setAttributes
	// is what other BlockEdit HOCs and the block component itself receive.
	5
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
 * Automatically adds the `syncChildStyles` attribute to blocks that act as a
 * sync scope, so they can store per-child-type sync on/off preferences without
 * requiring each scope block to manually declare the attribute in block.json.
 *
 * NOTE: `getBlockTypes()` is evaluated at block registration time. Blocks
 * registered after this filter runs will not be detected. For reliability
 * during development, scope blocks (e.g. core/accordion) can also declare
 * `syncChildStyles` explicitly in their block.json.
 *
 * @param {Object} settings Block type settings.
 * @param {string} name     Block name.
 * @return {Object} Possibly-modified settings.
 */
function addSyncChildStylesAttribute( settings, name ) {
	const isScope = getBlockTypes().some(
		( type ) =>
			type.supports?.__experimentalSiblingStyleSync?.scope === name
	);

	if ( ! isScope ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			syncChildStyles: {
				type: 'object',
				default: {},
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'core/sibling-style-sync/add-sync-child-styles-attribute',
	addSyncChildStylesAttribute
);
