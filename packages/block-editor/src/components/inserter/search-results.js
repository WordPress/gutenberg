/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternsList from '../patterns-list';
import InserterPanel from './panel';
import { searchItems, searchBlockItems } from './search-items';
import BlockTypesList from '../block-types-list';
import InserterNoResults from './no-results';
import __experimentalInserterMenuExtension from '../inserter-menu-extension';
import useInserterBlockItems from './use-inserter-block-items';
import useInserterPatterns from './use-inserter-patterns';

function BlockPatterns( {
	rootClientId,
	__experimentalSelectBlockOnInsert: selectBlockOnInsert,
	onInsert,
	onHover,
	filterValue,
} ) {
	const { categories, collections } = useSelect(
		( select ) => {
			const { getCategories, getCollections } = select( 'core/blocks' );
			return {
				categories: getCategories(),
				collections: getCollections(),
			};
		},
		[ rootClientId ]
	);

	const [ blockItems, onSelectBlockItem ] = useInserterBlockItems( {
		rootClientId,
		selectBlockOnInsert,
		onInsert,
	} );

	const [ patterns, onSelectPattern ] = useInserterPatterns( {
		onInsert,
	} );

	const filteredPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);

	const filteredBlocks = useMemo( () => {
		return searchBlockItems(
			blockItems,
			categories,
			collections,
			filterValue
		);
	}, [ filterValue, blockItems, categories, collections ] );

	return (
		<>
			{ !! filteredBlocks.length && (
				<InserterPanel title={ __( 'Blocks' ) }>
					<BlockTypesList
						items={ filteredBlocks }
						onSelect={ onSelectBlockItem }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }
			{ !! filteredPatterns.length && (
				<InserterPanel title={ __( 'Patterns' ) }>
					<PatternsList
						patterns={ filteredPatterns }
						onSelect={ onSelectPattern }
					/>
				</InserterPanel>
			) }
			{ ! filteredPatterns && ! filteredBlocks && (
				<__experimentalInserterMenuExtension.Slot
					fillProps={ {
						onSelect: onSelectBlockItem,
						onHover,
						filterValue,
						hasItems: false,
					} }
				>
					{ ( fills ) => {
						if ( fills.length ) {
							return (
								<InserterPanel
									title={ _x( 'Search Results', 'blocks' ) }
								>
									{ fills }
								</InserterPanel>
							);
						}
						return (
							<InserterNoResults filterValue={ filterValue } />
						);
					} }
				</__experimentalInserterMenuExtension.Slot>
			) }
		</>
	);
}

export default BlockPatterns;
