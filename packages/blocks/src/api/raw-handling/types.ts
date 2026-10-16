import type { BlockRawTransform, NormalizedBlockTransform } from '../../types';

/**
 * A raw transform as returned by `getRawTransforms`, where a matcher is always
 * present: transforms declaring only a `selector` get one built from it.
 */
export type RawTransform = NormalizedBlockTransform< BlockRawTransform > & {
	isMatch: NonNullable< BlockRawTransform[ 'isMatch' ] >;
};

export type NodeFilterFunction = (
	node: Node,
	doc: Document,
	schema?: Record< string, unknown >
) => void;
