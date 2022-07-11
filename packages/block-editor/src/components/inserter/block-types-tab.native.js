/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import useClipboardBlock from './hooks/use-clipboard-block';
import { store as blockEditorStore } from '../../store';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';
import { filterInserterItems } from './utils';
import useBlockTypesState from './hooks/use-block-types-state';

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

function BlockTypesTab( {
	onSelect,
	onInsert = () => {},
	rootClientId,
	listProps,
} ) {
	const clipboardBlock = useClipboardBlock( rootClientId );
	const [ , , collections ] = useBlockTypesState( rootClientId, onInsert );

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

	const itemsPerCollection = useMemo( () => {
		const result = [];
		Object.keys( collections ).forEach( ( namespace ) => {
			const data = items.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( data.length > 0 ) {
				result.push( {
					metadata: {
						icon: collections[ namespace ].icon,
						title: collections[ namespace ].title,
					},
					data: [
						{
							key: collections[ namespace ].title,
							list: data,
						},
					],
				} );
			}
		} );

		return result;
	}, [ items, collections ] );

	const handleSelect = ( ...args ) => {
		trackBlockTypeSelected( ...args );
		onSelect( ...args );
	};

	return (
		<BlockTypesList
			name="Blocks"
			items={ [
				{
					metadata: {},
					data: [ { key: 1, list: items } ],
				},
				...itemsPerCollection,
			] }
			onSelect={ handleSelect }
			listProps={ listProps }
		/>
	);
}

export default BlockTypesTab;
