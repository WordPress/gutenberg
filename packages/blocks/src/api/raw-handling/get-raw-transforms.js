/**
 * Internal dependencies
 */
import { getBlockTransforms } from '../factory';

export async function getRawTransforms() {
	const transforms = await getBlockTransforms( 'from' );
	return transforms
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
