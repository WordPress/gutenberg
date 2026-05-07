/**
 * Internal dependencies
 */
import normaliseBlocks from './normalise-blocks';

type Options = Record< string, unknown >;

export default function blockquoteNormaliser( options: Options = {} ) {
	return ( bq: Node ) => {
		if ( bq.nodeName !== 'BLOCKQUOTE' ) {
			return;
		}
		const node = bq as HTMLQuoteElement;

		node.innerHTML = normaliseBlocks( node.innerHTML, options );
	};
}
