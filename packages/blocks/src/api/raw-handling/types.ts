import type { BlockRawTransform } from '../../types';

/**
 * A raw transform as returned by `getRawTransforms`, where the declaring block
 * name and a matcher are always present.
 */
export type RawTransform = BlockRawTransform & {
	blockName: string;
	isMatch: NonNullable< BlockRawTransform[ 'isMatch' ] >;
};

export type NodeFilterFunction = (
	node: Node,
	doc: Document,
	schema?: Record< string, unknown >
) => void;
