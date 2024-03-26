/**
 * Internal dependencies
 */
import type { BlockIconRenderer } from './block-icon';
import type { BlockStoreState } from '../store/types';

/**
 * Describes a block collection.
 *
 * @see {@link BlockStoreState.collections}
 * @public
 */
export interface BlockCollection {
	title: string;
	icon?: BlockIconRenderer;
}
