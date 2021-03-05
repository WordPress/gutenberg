/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import { getBlockTransforms } from '../factory';

export function getRawTransforms() {
	return filter( getBlockTransforms( 'from' ), { type: 'raw' } ).map(
		( transform ) => {
			return transform.isMatch
				? transform
				: {
						...transform,
						isMatch: ( node ) =>
							transform.selector &&
							node.matches( transform.selector ),
				  };
		}
	);
}
