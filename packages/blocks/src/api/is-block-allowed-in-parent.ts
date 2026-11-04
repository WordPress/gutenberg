import { getBlockType } from './registration';

/**
 * Checks the direct parent relationship declared by two registered block types.
 * Either side may explicitly allow the relationship. Ancestor restrictions are
 * independent and are not changed by wrapping a block in another container.
 *
 * @param blockName  The child block type.
 * @param parentName The immediate parent block type.
 * @return Whether the direct parent relationship is allowed.
 */
export function isBlockAllowedInParent(
	blockName: string,
	parentName: string
): boolean {
	const blockType = getBlockType( blockName );
	const parentType = getBlockType( parentName );
	if ( ! blockType || ! parentType ) {
		return false;
	}

	const allowedByParent = parentType.allowedBlocks?.includes( blockName );
	const allowedByChild = blockType.parent?.includes( parentName );

	return (
		( allowedByParent === undefined && allowedByChild === undefined ) ||
		allowedByParent === true ||
		allowedByChild === true
	);
}
