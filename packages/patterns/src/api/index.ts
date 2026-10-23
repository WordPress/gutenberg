import type { BlockWithMetadata } from '../types';

/**
 * Determines whether a block is overridable.
 *
 * @param block The block to test.
 *
 * @return `true` if a block is overridable, `false` otherwise.
 */
export function isOverridableBlock( block: BlockWithMetadata ): boolean {
	return (
		!! block.attributes.metadata?.name &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}
