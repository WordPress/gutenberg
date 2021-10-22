/**
 * Internal dependencies
 */
import { createRegistry } from './registry';
import { BlockStore } from '@wordpress/blocks';

type Registry = {
	'core/blocks': BlockStore;
};

export default createRegistry< Registry >();
