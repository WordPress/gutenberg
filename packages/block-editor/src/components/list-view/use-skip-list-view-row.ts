import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit/context';
import { unlock } from '../../lock-unlock';

/**
 * Leaves the current block's own row out of List View, while `isSkipped` is
 * true. List View lists the block's inner blocks in its place, at its level,
 * and they can still be selected, moved and inserted next to. Use it for a
 * wrapper that people shouldn't have to think about, such as a list of pages
 * shown as items of a menu.
 *
 * @param isSkipped Whether to leave the block's row out.
 */
export default function useSkipListViewRow( isSkipped: boolean ) {
	const { clientId = '' } = useBlockEditContext();
	const registry = useRegistry();
	useEffect( () => {
		if ( ! isSkipped || ! clientId ) {
			return;
		}
		const { setListViewRowSkipped } = unlock(
			registry.dispatch( blockEditorStore )
		);
		setListViewRowSkipped( clientId, true );
		return () => {
			setListViewRowSkipped( clientId, false );
		};
	}, [ registry, clientId, isSkipped ] );
}
