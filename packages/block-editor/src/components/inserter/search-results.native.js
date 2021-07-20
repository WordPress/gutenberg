/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { searchItems } from './search-items';
import BlockTypesList from '../block-types-list';
import InserterNoResults from './no-results';
import { store as blockEditorStore } from '../../store';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';

function InserterSearchResults( {
	filterValue,
	onSelect,
	listProps,
	rootClientId,
} ) {
	const { blockTypes } = useSelect(
		( select ) => {
			const allItems = select( blockEditorStore ).getInserterItems(
				rootClientId
			);
			const filteredItems = searchItems( allItems, filterValue );

			return { blockTypes: filteredItems };
		},
		[ rootClientId, filterValue ]
	);

	const { items, trackBlockTypeSelected } = useBlockTypeImpressions(
		blockTypes
	);

	if ( ! items || items?.length === 0 ) {
		return <InserterNoResults />;
	}

	const handleSelect = ( ...args ) => {
		trackBlockTypeSelected( ...args );
		onSelect( ...args );
	};

	return (
		<BlockTypesList
			name="Blocks"
			{ ...{ items, onSelect: handleSelect, listProps } }
		/>
	);
}

export default InserterSearchResults;
