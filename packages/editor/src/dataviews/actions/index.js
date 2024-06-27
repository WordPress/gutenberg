/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import deletePost from './delete-post';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

export default function useDefaultActions() {
	const { registerEntityAction, unregisterEntityAction } = unlock(
		useDispatch( editorStore )
	);

	useEffect( () => {
		registerEntityAction( 'postType', '*', deletePost );

		return () => {
			unregisterEntityAction( 'postType', '*', deletePost.id );
		};
	}, [ registerEntityAction, unregisterEntityAction ] );
}
