/**
 * WordPress dependencies
 */
import { type StoreDescriptor, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import deletePost from './delete-post';
import exportPattern from './export-pattern';
import resetPost from './reset-post';
import trashPost from './trash-post';

// @ts-ignore
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function registerDefaultActions() {
	const { registerEntityAction } = unlock(
		dispatch( editorStore as StoreDescriptor )
	);

	registerEntityAction( 'postType', 'wp_block', exportPattern );
	registerEntityAction( 'postType', '*', resetPost );
	registerEntityAction( 'postType', '*', deletePost );
	registerEntityAction( 'postType', '*', trashPost );
}
