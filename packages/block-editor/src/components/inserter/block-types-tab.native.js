/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import useClipboardBlock from './hooks/use-clipboard-block';
import useBlockTypeImpressions from './hooks/use-block-type-impressions';
import { createInserterSection, filterInserterItems } from './utils';
import useBlockTypesState from './hooks/use-block-types-state';

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

function BlockTypesTab( { onSelect, rootClientId, listProps } ) {
	const [ rawBlockTypes, , collections ] = useBlockTypesState(
		rootClientId,
		onSelect
	);
	const clipboardBlock = useClipboardBlock( rootClientId );
	const filteredBlockTypes = filterInserterItems( rawBlockTypes );
	const blockTypes = clipboardBlock
		? [ clipboardBlock, ...filteredBlockTypes ]
		: filteredBlockTypes;
	const { items, trackBlockTypeSelected } =
		useBlockTypeImpressions( blockTypes );

	const handleSelect = ( ...args ) => {
		trackBlockTypeSelected( ...args );
		onSelect( ...args );
	};

	const collectionGroups = useMemo( () => {
		const result = [];
		Object.keys( collections ).forEach( ( namespace ) => {
			const data = items.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( data.length > 0 ) {
				result.push( {
					namespace,
					data,
				} );
			}
		} );

		return result;
	}, [ items, collections ] );

	const itemsFilteredByCollections = items.filter( ( { name } ) =>
		collectionGroups.some( ( collection ) => {
			return ! collection.data.some( ( { name: itemName } ) => {
				return itemName === name;
			} );
		} )
	);

	const collectionSections = collectionGroups.map( ( { namespace, data } ) =>
		createInserterSection( {
			key: `collection-${ namespace }`,
			metadata: {
				icon: collections[ namespace ].icon,
				title: collections[ namespace ].title,
			},
			items: data,
		} )
	);

	const sections = [
		createInserterSection( {
			key: 'default',
			items: itemsFilteredByCollections,
		} ),
		...collectionSections,
	];

	return (
		<BlockTypesList
			name="Blocks"
			sections={ sections }
			onSelect={ handleSelect }
			listProps={ listProps }
		/>
	);
}

export default BlockTypesTab;
