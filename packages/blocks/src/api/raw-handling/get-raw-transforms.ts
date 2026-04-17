/**
 * Internal dependencies
 */
import { getBlockTransforms } from '../factory';
import type { RawTransform } from './types';

export { type RawTransform } from './types';

export function getRawTransforms(): RawTransform[] {
	return ( getBlockTransforms( 'from' ) as any[] )
		.filter( ( { type } ) => type === 'raw' )
		.map( ( transform ) => {
			return transform.isMatch
				? transform
				: {
						...transform,
						isMatch: ( node: Element ) =>
							transform.selector &&
							node.matches( transform.selector ),
				  };
		} );
}
