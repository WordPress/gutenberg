/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from '../constants';

/**
 * Determines whether a block is overridable.
 *
 * @param {WPBlock} block The block to test.
 *
 * @return {boolean} `true` if a block is overridable, `false` otherwise.
 */
export function isOverridableBlock( block ) {
	return (
		Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
			block.name
		) &&
		!! block.attributes.metadata?.name &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}
