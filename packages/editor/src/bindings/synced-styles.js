/**
 * WordPress dependencies
 */
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

		const { getBlockParents, getBlockName, getBlockAttributes } =
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

		for ( const [ attrName, { newValue } ] of Object.entries( bindings ) ) {
			if ( newValue === undefined || newValue === null ) {
				delete updatedStyles[ attrName ];
			} else {
				updatedStyles[ attrName ] = newValue;
			}
		}

		dispatch( blockEditorStore ).updateBlockAttributes( parentClientId, {
			[ parentAttributeName ]: updatedStyles,
		} );
	},
	canUserEditValue: () => true,
};
