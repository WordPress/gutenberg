/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { getBlockType } from '@wordpress/blocks';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Generic bindings source for syncing styles across sibling inner blocks.
 *
 * The canonical style object lives on an ancestor block's attribute and is
 * shared to descendants via `providesContext`. The context key and the
 * attribute to read are both determined from the binding's `args.context`
 * value, making this source reusable for any block family — not just the
 * Accordion block.
 *
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/synced-styles',
	label: __( 'Synced Styles' ),
	getValues( { context, bindings } ) {
		// All bindings for this source share the same context key.
		const contextKey = Object.values( bindings )[ 0 ]?.args?.context;
		if ( ! contextKey ) {
			return {};
		}

		const syncedStyles = context[ contextKey ] ?? {};
		const values = {};
		for ( const attributeName of Object.keys( bindings ) ) {
			values[ attributeName ] = syncedStyles[ attributeName ];
		}
		return values;
	},
	setValues( { select, dispatch, clientId, bindings } ) {
		const contextKey = Object.values( bindings )[ 0 ]?.args?.context;
		if ( ! contextKey ) {
			return;
		}

		const { getBlockParents, getBlockName, getBlockAttributes, getBlocks } =
			select( blockEditorStore );

		// Walk up the block tree to find the ancestor that provides this context key.
		const parents = getBlockParents( clientId, true ); // ascending
		let parentClientId = null;
		let parentAttributeName = null;

		for ( const parentId of parents ) {
			const parentType = getBlockType( getBlockName( parentId ) );
			const providedAttr = parentType?.providesContext?.[ contextKey ];
			if ( providedAttr !== undefined ) {
				parentClientId = parentId;
				parentAttributeName = providedAttr;
				break;
			}
		}

		if ( ! parentClientId ) {
			return;
		}

		const currentSyncedStyles =
			getBlockAttributes( parentClientId )?.[ parentAttributeName ] ?? {};
		const updatedStyles = { ...currentSyncedStyles };
		const ownAttributeUpdates = {};

		for ( const [ attrName, { newValue } ] of Object.entries( bindings ) ) {
			if ( newValue === undefined || newValue === null ) {
				delete updatedStyles[ attrName ];
				ownAttributeUpdates[ attrName ] = undefined;
			} else {
				updatedStyles[ attrName ] = newValue;
				ownAttributeUpdates[ attrName ] = newValue;
			}
		}

		// Update the canonical synced styles on the parent.
		dispatch( blockEditorStore ).updateBlockAttributes( parentClientId, {
			[ parentAttributeName ]: updatedStyles,
		} );

		// The block wrapper (BlockListBlock) uses raw store attributes — not
		// binding-resolved computed attributes — when applying CSS classes and
		// inline styles. Write the resolved values back to each bound
		// descendant's own attributes so the editor visual reflects the change.
		const updateBoundDescendants = ( blocks ) => {
			for ( const block of blocks ) {
				const defaultBinding =
					block.attributes?.metadata?.bindings?.__default;
				if (
					defaultBinding?.source === 'core/synced-styles' &&
					defaultBinding?.args?.context === contextKey
				) {
					dispatch( blockEditorStore ).updateBlockAttributes(
						block.clientId,
						ownAttributeUpdates
					);
				}
				if ( block.innerBlocks?.length ) {
					updateBoundDescendants( block.innerBlocks );
				}
			}
		};

		updateBoundDescendants( getBlocks( parentClientId ) );
	},
	canUserEditValue: () => true,
};
