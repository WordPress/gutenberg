import type { Block } from '@wordpress/blocks';
import getRichTextValuesCached from './get-rich-text-values-cached';

const cache = new WeakMap< Block, Array< string > >();

function getBlockFootnotesOrder( block: Block ): Array< string > {
	if ( ! cache.has( block ) ) {
		const order: Array< string > = [];
		for ( const value of getRichTextValuesCached( block ) ) {
			if ( ! value ) {
				continue;
			}

			// replacements is a sparse array, use forEach to skip empty slots.
			value.replacements.forEach( ( { type, attributes } ) => {
				if ( type === 'core/footnote' ) {
					// A footnote format names its footnote.
					order.push( attributes![ 'data-fn' ] );
				}
			} );
		}
		cache.set( block, order );
	}

	// Set above when missing.
	return cache.get( block )!;
}

export default function getFootnotesOrder(
	blocks: Array< Block >
): Array< string > {
	// We can only separate getting order from blocks at the root level. For
	// deeper inner blocks, this will not work since it's possible to have both
	// inner blocks and block attributes, so order needs to be computed from the
	// Edit functions as a whole.
	return blocks.flatMap( getBlockFootnotesOrder );
}
