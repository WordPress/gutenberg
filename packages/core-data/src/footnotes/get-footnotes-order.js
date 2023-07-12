/**
 * Internal dependencies
 */
import getRichTextValuesCached from './get-rich-text-values-cached';

export default function getFootnotesOrder( blocks ) {
	const values = blocks.map( getRichTextValuesCached );
	const content = values.join( '' );

	const newOrder = [];

	// This can be avoided when
	// https://github.com/WordPress/gutenberg/pull/43204 lands. We can then
	// get the order directly from the rich text values.
	if ( content.indexOf( 'data-fn' ) !== -1 ) {
		const regex = /data-fn="([^"]+)"/g;
		let match;
		while ( ( match = regex.exec( content ) ) !== null ) {
			newOrder.push( match[ 1 ] );
		}
	}

	return newOrder;
}
