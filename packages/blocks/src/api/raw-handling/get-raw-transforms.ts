import { getBlockTransforms } from '../factory';
import type { RawTransform } from './types';

export { type RawTransform } from './types';

/**
 * Runs a declared transform's selector against a node.
 *
 * A selector comes from a block's `block.json`, so one block writing an invalid
 * one would otherwise throw out of every conversion rather than only failing to
 * match. It is treated as matching nothing instead.
 *
 * @param node     Node to match.
 * @param selector CSS selector.
 *
 * @return Whether the node matches.
 */
function matchesSelector( node: Element, selector: string ): boolean {
	try {
		return node.matches( selector );
	} catch {
		return false;
	}
}

export function getRawTransforms(): RawTransform[] {
	return ( getBlockTransforms( 'from' ) as any[] )
		.filter( ( { type } ) => type === 'raw' )
		.map( ( transform ) => {
			return transform.isMatch
				? transform
				: {
						...transform,
						isMatch: ( node: Element ) =>
							!! transform.selector &&
							matchesSelector( node, transform.selector ),
				  };
		} );
}
