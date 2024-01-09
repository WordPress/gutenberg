/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import InserterSidebar from './inserter-sidebar';
import ListViewSidebar from './list-view-sidebar';

export default function SecondarySidebar() {
	const { isInserterOpen, isListViewOpen } = useSelect( ( select ) => {
		const { isInserterOpened, isListViewOpened } = select( editorStore );
		return {
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
		};
	}, [] );

	if ( isInserterOpen ) {
		return <InserterSidebar />;
	}
	if ( isListViewOpen ) {
		return <ListViewSidebar />;
	}
	return null;
}
