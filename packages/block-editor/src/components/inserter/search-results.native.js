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

const NON_BLOCK_CATEGORIES = [ 'reusable' ];
const ALLOWED_EMBED_VARIATIONS = [ 'core/embed' ];

function InserterSearchResults( {
	filterValue,
	onSelect,
	listProps,
	rootClientId,
	isFullScreen,
} ) {
	const { blockTypes } = useSelect(
		( select ) => {
			const allItems = select( blockEditorStore ).getInserterItems(
				rootClientId
			);

			const blockItems = allItems.filter(
				( { id, category } ) =>
					! NON_BLOCK_CATEGORIES.includes( category ) &&
					// We don't want to show all possible embed variations
					// as different blocks in the inserter. We'll only show a
					// few popular ones.
					( category !== 'embed' ||
						( category === 'embed' &&
							ALLOWED_EMBED_VARIATIONS.includes( id ) ) )
			);

			const filteredItems = searchItems( blockItems, filterValue );

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
			initialNumToRender={ isFullScreen ? 10 : 3 }
			{ ...{ items, onSelect: handleSelect, listProps } }
		/>
	);
}

export default InserterSearchResults;
