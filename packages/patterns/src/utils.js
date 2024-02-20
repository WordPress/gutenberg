/**
 * Internal dependencies
 */
import { PARTIAL_SYNCING_SUPPORTED_BLOCKS } from './constants';

export function hasOverridableAttributes( block ) {
	return (
		Object.keys( PARTIAL_SYNCING_SUPPORTED_BLOCKS ).includes(
			block.name
		) &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}

export function hasOverridableBlocks( blocks ) {
	return blocks.some( ( block ) => {
		if ( hasOverridableAttributes( block ) ) return true;
		return hasOverridableBlocks( block.innerBlocks );
	} );
}

export function getOverridableAttributes( block ) {
	return Object.entries( block.attributes.metadata.bindings )
		.filter(
			( [ , binding ] ) => binding.source === 'core/pattern-overrides'
		)
		.map( ( [ attributeKey ] ) => attributeKey );
}
