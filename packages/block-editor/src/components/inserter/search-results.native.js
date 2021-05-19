/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { searchItems } from './search-items';
import BlockTypesList from '../block-types-list';
import { store as blockEditorStore } from '../../store';

function InserterSearchResults( {
	filterValue,
	onSelect,
	listProps,
	rootClientId,
} ) {
	const { items } = useSelect(
		( select ) => {
			const allItems = select( blockEditorStore ).getInserterItems(
				rootClientId
			);
			const filteredItems = searchItems( allItems, filterValue );

			return { items: filteredItems };
		},
		[ rootClientId, filterValue ]
	);

	return (
		<BlockTypesList name="Blocks" { ...{ items, onSelect, listProps } } />
	);
}

export default InserterSearchResults;
