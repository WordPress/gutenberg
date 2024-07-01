/**
 * WordPress dependencies
 */
import { type StoreDescriptor, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import deletePost from './delete-post';
// @ts-ignore
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function registerDefaultActions() {
	const { registerEntityAction } = unlock(
		dispatch( editorStore as StoreDescriptor )
	);

	registerEntityAction( 'postType', '*', deletePost );
}
