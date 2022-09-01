/**
 * Internal dependencies
 */
import { getBlockTransforms } from '../factory';

export function getRawTransforms() {
	return getBlockTransforms( 'from' )
		.filter( ( { type } ) => type === 'raw' )
		.map( ( transform ) => {
			return transform.isMatch
				? transform
				: {
						...transform,
						isMatch: ( node ) =>
							transform.selector &&
							node.matches( transform.selector ),
				  };
		} );
}
