import { getBlockTransforms } from '../factory';
import { matchesSelector } from '../matches-selector';
import type { BlockRawTransform, NormalizedBlockTransform } from '../../types';
import type { RawTransform } from './types';

export { type RawTransform } from './types';

export function getRawTransforms(): RawTransform[] {
	return getBlockTransforms( 'from' )
		.filter(
			(
				transform
			): transform is NormalizedBlockTransform< BlockRawTransform > =>
				transform.type === 'raw'
		)
		.map( ( transform ) => ( {
			...transform,
			// Only a function is callable: a PHP-registered callable that
			// travelled through JSON arrives as `{}` or `[ 'Class', 'method' ]`,
			// both truthy, and calling either would throw on every paste.
			isMatch:
				typeof transform.isMatch === 'function'
					? transform.isMatch
					: ( node: Element ) =>
							!! transform.selector &&
							matchesSelector( node, transform.selector ),
		} ) );
}
