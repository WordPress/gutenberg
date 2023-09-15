/**
 * WordPress dependencies
 */
import { create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import getRichTextValuesCached from './get-rich-text-values-cached';

const cache = new WeakMap();

function getBlockFootnotesOrder( block ) {
	if ( ! cache.has( block ) ) {
		const order = getRichTextValuesCached( block ).reduce(
			( acc, value ) => {
				if ( value.indexOf( 'data-fn' ) !== -1 ) {
					create( { html: value } ).replacements.forEach(
						( { type, attributes } ) => {
							if ( type === 'core/footnote' ) {
								acc.push( attributes[ 'data-fn' ] );
							}
						}
					);
				}
				return acc;
			},
			[]
		);
		cache.set( block, order );
	}

	return cache.get( block );
}

export default function getFootnotesOrder( blocks ) {
	// We can only separate getting order from blocks at the root level. For
	// deeper inner blocks, this will not work since it's possible to have both
	// inner blocks and block attributes, so order needs to be computed from the
	// Edit functions as a whole.
	return blocks.flatMap( getBlockFootnotesOrder );
}
