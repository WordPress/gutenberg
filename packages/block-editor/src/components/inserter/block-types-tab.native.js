/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import InserterPanel from './panel';
import useClipboardBlock from './hooks/use-clipboard-block';
import { store as blockEditorStore } from '../../store';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';
import { filterInserterItems } from './utils';
import useBlockTypesState from './hooks/use-block-types-state';

function BlockTypesTab( {
	onSelect,
	onInsert = () => {},
	rootClientId,
	listProps,
} ) {
	const clipboardBlock = useClipboardBlock( rootClientId );
	const [ _items, categories, collections, onSelectItem ] =
		useBlockTypesState( rootClientId, onInsert );
	console.log( '>>>', { categories } );

	const { blockTypes } = useSelect(
		( select ) => {
			const { getInserterItems } = select( blockEditorStore );
			const blockItems = filterInserterItems(
				getInserterItems( rootClientId )
			);

			return {
				blockTypes: clipboardBlock
					? [ clipboardBlock, ...blockItems ]
					: blockItems,
			};
		},
		[ rootClientId ]
	);

	const { items, trackBlockTypeSelected } =
		useBlockTypeImpressions( blockTypes );

	const handleSelect = ( ...args ) => {
		trackBlockTypeSelected( ...args );
		onSelect( ...args );
	};

	return (
		<InserterPanel
			key={ categories[ categories.length - 1 ].slug }
			title={ categories[ categories.length - 1 ].title }
			icon={ categories[ categories.length - 1 ].icon }
		>
			<BlockTypesList
				name="Blocks"
				items={ items }
				onSelect={ handleSelect }
				listProps={ listProps }
			/>
		</InserterPanel>
	);
}

export default BlockTypesTab;
