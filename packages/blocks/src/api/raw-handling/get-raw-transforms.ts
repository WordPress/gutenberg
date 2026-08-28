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
			isMatch:
				transform.isMatch ??
				( ( node: Element ) =>
					!! transform.selector &&
					matchesSelector( node, transform.selector ) ),
		} ) );
}
