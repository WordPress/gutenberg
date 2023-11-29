/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

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
	const { inserterItems } = useSelect(
		( select ) => {
			const items =
				select( blockEditorStore ).getInserterItems( rootClientId );

			return { inserterItems: items };
		},
		[ rootClientId ]
	);

	const blockTypes = useMemo( () => {
		const availableItems = filterInserterItems( inserterItems, {
			allowReusable: true,
		} );

		return searchItems( availableItems, filterValue );
	}, [ inserterItems, filterValue ] );

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
