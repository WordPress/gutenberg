/**
 * WordPress dependencies
 */
import type { BlockStore } from '@wordpress/blocks';
import type { EditPostStore } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import { createRegistry } from './registry';

export type Registry = {
	'core/blocks': BlockStore;
	'core/edit-post': EditPostStore;
};

export default createRegistry< Registry >();
