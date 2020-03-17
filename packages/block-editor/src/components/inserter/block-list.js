/**
 * External dependencies
 */
import {
	map,
	pick,
	includes,
	filter,
	findIndex,
	flow,
	sortBy,
	groupBy,
	isEmpty,
	without,
} from 'lodash';
import scrollIntoView from 'dom-scroll-into-view';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { PanelBody, withSpokenMessages } from '@wordpress/components';
import { addQueryArgs } from '@wordpress/url';
import { controlsRepeat } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { createBlock, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useMemo, useEffect, useState, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { compose, withSafeTimeout } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import ChildBlocks from './child-blocks';
import __experimentalInserterMenuExtension from '../inserter-menu-extension';
import { searchItems } from './search-items';

// Copied over from the Columns block. It seems like it should become part of public API.
const createBlocksFromInnerBlocksTemplate = ( innerBlocksTemplate ) => {
	return map(
		innerBlocksTemplate,
		( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock(
				name,
				attributes,
				createBlocksFromInnerBlocksTemplate( innerBlocks )
			)
	);
};

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

const MAX_SUGGESTED_ITEMS = 9;

function InserterBlockList( {
	clientId,
	isAppender,
	rootClientId,
	onSelect,
	onHover,
	__experimentalSelectBlockOnInsert: selectBlockOnInsert,
	filterValue,
	debouncedSpeak,
	setTimeout: safeSetTimeout,
} ) {
	const {
		categories,
		collections,
		items,
		rootChildBlocks,
		getSelectedBlock,
		destinationRootClientId,
		getBlockIndex,
		getBlockSelectionEnd,
		getBlockOrder,
		fetchReusableBlocks,
	} = useSelect(
		( select ) => {
			const {
				getInserterItems,
				getBlockName,
				getBlockRootClientId,
				getBlockSelectionEnd: _getBlockSelectionEnd,
				getSettings,
			} = select( 'core/block-editor' );
			const {
				getCategories,
				getCollections,
				getChildBlockNames,
			} = select( 'core/blocks' );

			let destRootClientId = rootClientId;
			if ( ! destRootClientId && ! clientId && ! isAppender ) {
				const end = _getBlockSelectionEnd();
				if ( end ) {
					destRootClientId = getBlockRootClientId( end ) || undefined;
				}
			}
			const destinationRootBlockName = getBlockName( destRootClientId );

			const { __experimentalFetchReusableBlocks } = getSettings();

			return {
				categories: getCategories(),
				collections: getCollections(),
				rootChildBlocks: getChildBlockNames( destinationRootBlockName ),
				items: getInserterItems( destRootClientId ),
				destinationRootClientId: destRootClientId,
				fetchReusableBlocks: __experimentalFetchReusableBlocks,
				...pick( select( 'core/block-editor' ), [
					'getSelectedBlock',
					'getBlockIndex',
					'getBlockSelectionEnd',
					'getBlockOrder',
				] ),
			};
		},
		[ clientId, isAppender, rootClientId ]
	);
	const {
		replaceBlocks,
		insertBlock,
		showInsertionPoint,
		hideInsertionPoint,
	} = useDispatch( 'core/block-editor' );

	// Fetch resuable blocks on mount
	useEffect( () => {
		if ( fetchReusableBlocks ) {
			fetchReusableBlocks();
		}
	}, [] );

	// To avoid duplication, getInsertionIndex is extracted and used in two event handlers
	// This breaks the withDispatch not containing any logic rule.
	// Since it's a function only called when the event handlers are called,
	// it's fine to extract it.
	// eslint-disable-next-line no-restricted-syntax
	function getInsertionIndex() {
		// If the clientId is defined, we insert at the position of the block.
		if ( clientId ) {
			return getBlockIndex( clientId, destinationRootClientId );
		}

		// If there a selected block, we insert after the selected block.
		const end = getBlockSelectionEnd();
		if ( ! isAppender && end ) {
			return getBlockIndex( end, destinationRootClientId ) + 1;
		}

		// Otherwise, we insert at the end of the current rootClientId
		return getBlockOrder( destinationRootClientId ).length;
	}

	const onHoverItem = ( item ) => {
		onHover( item );
		if ( item ) {
			const index = getInsertionIndex();
			showInsertionPoint( destinationRootClientId, index );
		} else {
			hideInsertionPoint();
		}
	};

	const onSelectItem = ( item ) => {
		const { name, title, initialAttributes, innerBlocks } = item;
		const selectedBlock = getSelectedBlock();
		const insertedBlock = createBlock(
			name,
			initialAttributes,
			createBlocksFromInnerBlocksTemplate( innerBlocks )
		);
		if (
			! isAppender &&
			selectedBlock &&
			isUnmodifiedDefaultBlock( selectedBlock )
		) {
			replaceBlocks( selectedBlock.clientId, insertedBlock );
		} else {
			insertBlock(
				insertedBlock,
				getInsertionIndex(),
				destinationRootClientId,
				selectBlockOnInsert
			);

			if ( ! selectBlockOnInsert ) {
				// translators: %s: the name of the block that has been added
				const message = sprintf( __( '%s block added' ), title );
				speak( message );
			}
		}

		onSelect();
		return insertedBlock;
	};

	const filteredItems = useMemo( () => {
		return searchItems( items, categories, collections, filterValue );
	}, [ filterValue, items, categories, collections ] );

	const childItems = useMemo( () => {
		return filter( filteredItems, ( { name } ) =>
			includes( rootChildBlocks, name )
		);
	}, [ filteredItems, rootChildBlocks ] );

	const suggestedItems = useMemo( () => {
		return filter( items, ( item ) => item.utility > 0 ).slice(
			0,
			MAX_SUGGESTED_ITEMS
		);
	}, [ items ] );

	const reusableItems = useMemo( () => {
		return filter( filteredItems, { category: 'reusable' } );
	}, [ filteredItems ] );

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
		)( filteredItems );
	}, [ filteredItems, categories ] );

	const itemsPerCollection = useMemo( () => {
		// Create a new Object to avoid mutating collection
		const result = { ...collections };
		Object.keys( collections ).forEach( ( namespace ) => {
			result[ namespace ] = filteredItems.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( result[ namespace ].length === 0 ) {
				delete result[ namespace ];
			}
		} );

		return result;
	}, [ filteredItems, collections ] );

	const inserterResults = useRef();
	const panels = useRef( [] );
	const bindPanel = ( name ) => ( ref ) => {
		panels.current[ name ] = ref;
	};
	const [ openPanels, setOpenPanels ] = useState( [ 'suggested' ] );

	const onTogglePanel = ( panel ) => {
		return () => {
			const isOpened = openPanels.indexOf( panel ) !== -1;
			if ( isOpened ) {
				setOpenPanels( without( openPanels, panel ) );
			} else {
				setOpenPanels( [ ...openPanels, panel ] );

				safeSetTimeout( () => {
					// We need a generic way to access the panel's container
					scrollIntoView(
						panels.current[ panel ],
						inserterResults.current,
						{
							alignWithTop: true,
						}
					);
				} );
			}
		};
	};

	// Update the open panels on search
	useEffect( () => {
		if ( ! filterValue ) {
			setOpenPanels( [ 'suggested' ] );
			return;
		}
		let newOpenPanels = [];
		if ( reusableItems.length > 0 ) {
			newOpenPanels.push( 'reusable' );
		}
		if ( filteredItems.length > 0 ) {
			newOpenPanels = newOpenPanels.concat(
				Object.keys( itemsPerCategory ),
				Object.keys( itemsPerCollection )
			);
		}

		setOpenPanels( newOpenPanels );
	}, [
		filterValue,
		filteredItems,
		reusableItems,
		itemsPerCategory,
		itemsPerCollection,
	] );

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
			_n( '%d result found.', '%d results found.', resultCount ),
			resultCount
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ itemsPerCategory, debouncedSpeak ] );

	const isPanelOpen = ( panel ) => openPanels.indexOf( panel ) !== -1;

	const hasItems =
		! isEmpty( suggestedItems ) ||
		! isEmpty( reusableItems ) ||
		! isEmpty( itemsPerCategory ) ||
		! isEmpty( itemsPerCollection );

	return (
		<div
			className="block-editor-inserter__results"
			ref={ inserterResults }
			tabIndex="0"
			role="region"
			aria-label={ __( 'Available block types' ) }
		>
			<ChildBlocks
				rootClientId={ rootClientId }
				items={ childItems }
				onSelect={ onSelectItem }
				onHover={ onHoverItem }
			/>

			{ !! suggestedItems.length && ! filterValue && (
				<PanelBody
					title={ _x( 'Most used', 'blocks' ) }
					opened={ isPanelOpen( 'suggested' ) }
					onToggle={ onTogglePanel( 'suggested' ) }
					ref={ bindPanel( 'suggested' ) }
				>
					<BlockTypesList
						items={ suggestedItems }
						onSelect={ onSelectItem }
						onHover={ onHoverItem }
					/>
				</PanelBody>
			) }

			{ map( categories, ( category ) => {
				const categoryItems = itemsPerCategory[ category.slug ];
				if ( ! categoryItems || ! categoryItems.length ) {
					return null;
				}
				return (
					<PanelBody
						key={ category.slug }
						title={ category.title }
						icon={ category.icon }
						opened={ isPanelOpen( category.slug ) }
						onToggle={ onTogglePanel( category.slug ) }
						ref={ bindPanel( category.slug ) }
					>
						<BlockTypesList
							items={ categoryItems }
							onSelect={ onSelectItem }
							onHover={ onHoverItem }
						/>
					</PanelBody>
				);
			} ) }

			{ map( collections, ( collection, namespace ) => {
				const collectionItems = itemsPerCollection[ namespace ];
				if ( ! collectionItems || ! collectionItems.length ) {
					return null;
				}

				return (
					<PanelBody
						key={ namespace }
						title={ collection.title }
						icon={ collection.icon }
						opened={ isPanelOpen( namespace ) }
						onToggle={ onTogglePanel( namespace ) }
						ref={ bindPanel( namespace ) }
					>
						<BlockTypesList
							items={ collectionItems }
							onSelect={ onSelectItem }
							onHover={ onHoverItem }
						/>
					</PanelBody>
				);
			} ) }

			{ !! reusableItems.length && (
				<PanelBody
					className="block-editor-inserter__reusable-blocks-panel"
					title={ __( 'Reusable' ) }
					opened={ isPanelOpen( 'reusable' ) }
					onToggle={ onTogglePanel( 'reusable' ) }
					icon={ controlsRepeat }
					ref={ bindPanel( 'reusable' ) }
				>
					<BlockTypesList
						items={ reusableItems }
						onSelect={ onSelectItem }
						onHover={ onHoverItem }
					/>
					<a
						className="block-editor-inserter__manage-reusable-blocks"
						href={ addQueryArgs( 'edit.php', {
							post_type: 'wp_block',
						} ) }
					>
						{ __( 'Manage all reusable blocks' ) }
					</a>
				</PanelBody>
			) }

			<__experimentalInserterMenuExtension.Slot
				fillProps={ {
					onSelect: onSelectItem,
					onHover: onHoverItem,
					filterValue,
					hasItems,
				} }
			>
				{ ( fills ) => {
					if ( fills.length ) {
						return fills;
					}
					if ( ! hasItems ) {
						return (
							<p className="block-editor-inserter__no-results">
								{ __( 'No blocks found.' ) }
							</p>
						);
					}
					return null;
				} }
			</__experimentalInserterMenuExtension.Slot>
		</div>
	);
}

export default compose(
	withSpokenMessages,
	withSafeTimeout
)( InserterBlockList );
