/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import deletePermanently from './delete-permanently';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

export default function useDefaultActions() {
	const { registerEntityAction, unregisterEntityAction } = unlock(
		useDispatch( editorStore )
	);

	useEffect( () => {
		registerEntityAction( 'postType', '*', deletePermanently );

		return () => {
			unregisterEntityAction( 'postType', '*', deletePermanently.id );
		};
	}, [ registerEntityAction, unregisterEntityAction ] );
}
