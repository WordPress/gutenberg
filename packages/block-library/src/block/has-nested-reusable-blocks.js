const DISALLOWED_BLOCKS = [ 'core/block', 'core/template-part' ];

export default function hasNestedReusableBlocks( block ) {
	if ( Array.isArray( block ) ) {
		return block.some( hasNestedReusableBlocks );
	}
	return (
		DISALLOWED_BLOCKS.includes( block.name ) ||
		block.innerBlocks.some( hasNestedReusableBlocks )
	);
}
