/**
 * A cheap "has any block changed?" check for the block-editor store.
 *
 * `getBlocks()` returns a tree the store replaces whenever an attribute or
 * structure changes, which makes its identity a good change signal. It has
 * one gap: an update inside a block whose inner blocks are controlled (a
 * synced pattern, a template part) stops at that block, and the change lands
 * in a separate `getBlocks( controlledClientId )` tree while the root stays
 * the same. The version below watches the root tree and every controlled
 * subtree, so an edit anywhere in the document produces a new version.
 *
 * The list of controlled blocks is rebuilt whenever the block order changes.
 * A block that becomes controlled after the version was taken gets its inner
 * blocks through `replaceInnerBlocks`, which changes the order even when the
 * root tree keeps its identity.
 */

type Entry = {
	clientIds: unknown;
	controlledIds: string[];
	trees: unknown[];
	version: object;
};

const entriesByRoot = new WeakMap< object, Entry >();

function controlledSubtrees( blockEditor: any ) {
	const clientIds = blockEditor.getClientIdsWithDescendants?.() ?? [];
	const controlledIds: string[] = clientIds.filter( ( clientId: string ) =>
		blockEditor.areInnerBlocksControlled?.( clientId )
	);
	return {
		clientIds,
		controlledIds,
		trees: controlledIds.map( ( clientId ) =>
			blockEditor.getBlocks( clientId )
		),
	};
}

/**
 * An object that stays the same while no block in the document changes and
 * is replaced when any does. Compare versions by identity, or key a `WeakMap`
 * cache on them.
 *
 * @param blockEditor Block-editor selectors.
 * @return The current version, or null when the store is unavailable.
 */
export function getBlockTreeVersion( blockEditor: any ): object | null {
	const root = blockEditor?.getBlocks?.();
	if ( ! root ) {
		return null;
	}
	const entry = entriesByRoot.get( root );
	if ( ! entry ) {
		const created = { ...controlledSubtrees( blockEditor ), version: {} };
		entriesByRoot.set( root, created );
		return created.version;
	}
	const changed =
		blockEditor.getClientIdsWithDescendants?.() !== entry.clientIds ||
		entry.controlledIds.some(
			( clientId, index ) =>
				blockEditor.getBlocks( clientId ) !== entry.trees[ index ]
		);
	if ( changed ) {
		// Blocks can gain or lose controlled inner blocks, so the list is
		// rebuilt along with the trees.
		Object.assign( entry, controlledSubtrees( blockEditor ), {
			version: {},
		} );
	}
	return entry.version;
}
