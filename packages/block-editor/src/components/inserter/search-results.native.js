/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { searchItems } from './search-items';
import BlockTypesList from '../block-types-list';
import InserterNoResults from './no-results';
import { store as blockEditorStore } from '../../store';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';
import { createInserterSection, filterInserterItems } from './utils';

function InserterSearchResults( {
	filterValue,
	onSelect,
	listProps,
	rootClientId,
	isFullScreen,
} ) {
	const { blockTypes } = useSelect(
		( select ) => {
			const allItems =
				select( blockEditorStore ).getInserterItems( rootClientId );

			const availableItems = filterInserterItems( allItems, {
				allowReusable: true,
			} );
			const filteredItems = searchItems( availableItems, filterValue );

			return { blockTypes: filteredItems };
		},
		[ rootClientId, filterValue ]
	);

	const { items, trackBlockTypeSelected } =
		useBlockTypeImpressions( blockTypes );

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
			sections={ [ createInserterSection( { key: 'search', items } ) ] }
			onSelect={ handleSelect }
			listProps={ listProps }
			label={ __( 'Blocks' ) }
		/>
	);
}

export default InserterSearchResults;
