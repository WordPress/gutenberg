/**
 * Internal dependencies
 */
import getRichTextValuesCached from './get-rich-text-values-cached';

const cache = new WeakMap();

function getBlockFootnotesOrder( block ) {
	if ( ! cache.has( block ) ) {
		const content = getRichTextValuesCached( block ).join( '' );
		const newOrder = [];

		// https://github.com/WordPress/gutenberg/pull/43204 lands. We can then
		// get the order directly from the rich text values.
		if ( content.indexOf( 'data-fn' ) !== -1 ) {
			const regex = /data-fn="([^"]+)"/g;
			let match;
			while ( ( match = regex.exec( content ) ) !== null ) {
				newOrder.push( match[ 1 ] );
			}
		}
		cache.set( block, newOrder );
	}

	return cache.get( block );
}

export default function getFootnotesOrder( blocks ) {
	return blocks.flatMap( getBlockFootnotesOrder );
}
