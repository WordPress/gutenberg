/**
 * External dependencies
 */
import {
	map,
	includes,
	filter,
	findIndex,
	flow,
	sortBy,
	groupBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { withSpokenMessages } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import { controlsRepeat } from '@wordpress/icons';
import { useMemo, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import ChildBlocks from './child-blocks';
import InserterPanel from './panel';
import useInserterBlockItems from './use-inserter-block-items';

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

const MAX_SUGGESTED_ITEMS = 9;

function BlocksTab( {
	rootClientId,
	onInsert,
	onHover,
	__experimentalSelectBlockOnInsert: selectBlockOnInsert,
	filterValue,
	debouncedSpeak,
} ) {
	const [ items, onSelectItem ] = useInserterBlockItems( {
		rootClientId,
		selectBlockOnInsert,
		onInsert,
	} );
	const { categories, collections, rootChildBlocks } = useSelect(
		( select ) => {
			const { getBlockName } = select( 'core/block-editor' );
			const {
				getCategories,
				getCollections,
				getChildBlockNames,
			} = select( 'core/blocks' );
			const rootBlockName = getBlockName( rootClientId );

			return {
				categories: getCategories(),
				collections: getCollections(),
				rootChildBlocks: getChildBlockNames( rootBlockName ),
			};
		},
		[ rootClientId ]
	);

	const childItems = useMemo( () => {
		return filter( items, ( { name } ) =>
			includes( rootChildBlocks, name )
		);
	}, [ items, rootChildBlocks ] );

	const suggestedItems = useMemo( () => {
		return filter( items, ( item ) => item.utility > 0 ).slice(
			0,
			MAX_SUGGESTED_ITEMS
		);
	}, [ items ] );

	const reusableItems = useMemo( () => {
		return filter( items, { category: 'reusable' } );
	}, [ items ] );

	const itemsPerCategory = useMemo( () => {
		const getCategoryIndex = ( item ) => {
			return findIndex(
				categories,
				( category ) => category.slug === item.category
			);
		};

		return flow(
			( itemList ) =>
				filter( itemList, ( item ) => item.category !== 'reusable' ),
			( itemList ) => sortBy( itemList, getCategoryIndex ),
			( itemList ) => groupBy( itemList, 'category' )
		)( items );
	}, [ items, categories ] );

	const itemsPerCollection = useMemo( () => {
		// Create a new Object to avoid mutating collection
		const result = { ...collections };
		Object.keys( collections ).forEach( ( namespace ) => {
			result[ namespace ] = items.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( result[ namespace ].length === 0 ) {
				delete result[ namespace ];
			}
		} );

		return result;
	}, [ items, collections ] );

	// Announce search results on change
	useEffect( () => {
		const resultCount = Object.keys( itemsPerCategory ).reduce(
			( accumulator, currentCategorySlug ) => {
				return (
					accumulator + itemsPerCategory[ currentCategorySlug ].length
				);
			},
			0
		);

		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ itemsPerCategory, debouncedSpeak ] );

	const hasChildItems = childItems.length > 0;

	return (
		<div>
			<ChildBlocks
				rootClientId={ rootClientId }
				items={ childItems }
				onSelect={ onSelectItem }
				onHover={ onHover }
			/>

			{ ! hasChildItems && !! suggestedItems.length && ! filterValue && (
				<InserterPanel title={ _x( 'Most used', 'blocks' ) }>
					<BlockTypesList
						items={ suggestedItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }

			{ ! hasChildItems &&
				map( categories, ( category ) => {
					const categoryItems = itemsPerCategory[ category.slug ];
					if ( ! categoryItems || ! categoryItems.length ) {
						return null;
					}
					return (
						<InserterPanel
							key={ category.slug }
							title={ category.title }
							icon={ category.icon }
						>
							<BlockTypesList
								items={ categoryItems }
								onSelect={ onSelectItem }
								onHover={ onHover }
							/>
						</InserterPanel>
					);
				} ) }

			{ ! hasChildItems &&
				map( collections, ( collection, namespace ) => {
					const collectionItems = itemsPerCollection[ namespace ];
					if ( ! collectionItems || ! collectionItems.length ) {
						return null;
					}

					return (
						<InserterPanel
							key={ namespace }
							title={ collection.title }
							icon={ collection.icon }
						>
							<BlockTypesList
								items={ collectionItems }
								onSelect={ onSelectItem }
								onHover={ onHover }
							/>
						</InserterPanel>
					);
				} ) }

			{ ! hasChildItems && !! reusableItems.length && (
				<InserterPanel
					className="block-editor-inserter__reusable-blocks-panel"
					title={ __( 'Reusable' ) }
					icon={ controlsRepeat }
				>
					<BlockTypesList
						items={ reusableItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
					/>
					<a
						className="block-editor-inserter__manage-reusable-blocks"
						href={ addQueryArgs( 'edit.php', {
							post_type: 'wp_block',
						} ) }
					>
						{ __( 'Manage all reusable blocks' ) }
					</a>
				</InserterPanel>
			) }
		</div>
	);
}

export default withSpokenMessages( BlocksTab );
