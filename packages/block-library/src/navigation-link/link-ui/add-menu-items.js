/**
 * WordPress dependencies
 */
import {
	Button,
	CheckboxControl,
	Modal,
	privateApis as componentsPrivateApis,
	SelectControl,
	Spinner,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	store as coreStore,
	useEntityRecords,
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
} from '@wordpress/core-data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const PER_PAGE = 20;

/** Pixels inset so checkbox focus rings are not clipped by the scroll container. */
const CHECKBOX_FOCUS_INSET = 8;

/** Only these four WordPress types use tabs; everything else is under “More types…”. */
const MAIN_TABS = [
	{ id: 'page', kind: 'postType', label: __( 'Pages' ) },
	{ id: 'post', kind: 'postType', label: __( 'Posts' ) },
	{ id: 'category', kind: 'taxonomy', label: __( 'Categories' ) },
	{ id: 'post_tag', kind: 'taxonomy', label: __( 'Tags' ) },
];

const MAIN_TAB_SLUGS = new Set( MAIN_TABS.map( ( t ) => t.id ) );

/**
 * @param {string} taxonomySlug REST taxonomy slug (e.g. post_tag).
 * @return {string} Value stored on `core/navigation-link` `type` attribute.
 */
export function taxonomySlugToNavType( taxonomySlug ) {
	if ( taxonomySlug === 'post_tag' ) {
		return 'tag';
	}
	return taxonomySlug.replace( /-/g, '_' );
}

/**
 * Maps a post or term REST record to navigation-link block attributes.
 *
 * @param {Object} record     REST entity.
 * @param {string} entityKind 'postType' or 'taxonomy'.
 * @param {string} entityName Post type or taxonomy slug (REST).
 * @return {Object} Block attributes for `core/navigation-link`.
 */
export function recordToNavigationLinkAttributes(
	record,
	entityKind,
	entityName
) {
	if ( entityKind === 'postType' ) {
		return {
			kind: 'post-type',
			type: entityName,
			id: record.id,
			url: record.link,
			label: decodeEntities(
				record.title?.rendered || record.slug || ''
			),
		};
	}

	return {
		kind: 'taxonomy',
		type: taxonomySlugToNavType( entityName ),
		id: record.id,
		url: record.link,
		label: decodeEntities( record.name || record.slug || '' ),
	};
}

export function selectionKey( entityKind, entityName, id ) {
	return `${ entityKind }:${ entityName }:${ id }`;
}

/**
 * Maps a link search API result to a minimal post/term REST-like record for
 * `recordToNavigationLinkAttributes` and list rendering.
 *
 * @param {{ id: number, url: string, title: string }} result
 * @param {'postType'|'taxonomy'}                      entityKind
 * @return {Object} REST-shaped post or term used by list rendering and block attributes.
 */
function searchResultToPseudoRecord( result, entityKind ) {
	if ( entityKind === 'postType' ) {
		return {
			id: result.id,
			link: result.url,
			title: { rendered: result.title },
		};
	}
	return {
		id: result.id,
		link: result.url,
		name: result.title,
	};
}

/**
 * @param {Object} record Post or term from REST.
 * @return {number} Parent id, or 0 for none / top-level.
 */
function getRecordParentId( record ) {
	const p = record.parent;
	if ( p === undefined || p === null ) {
		return 0;
	}
	return typeof p === 'number' ? p : parseInt( p, 10 ) || 0;
}

/**
 * @param {Object}                a
 * @param {Object}                b
 * @param {'postType'|'taxonomy'} entityKind
 * @return {number} Negative if `a` sorts before `b`, positive if after, zero if equal.
 */
function sortHierarchySiblings( a, b, entityKind ) {
	if ( entityKind === 'postType' ) {
		const orderA = a.menu_order ?? 0;
		const orderB = b.menu_order ?? 0;
		if ( orderA !== orderB ) {
			return orderA - orderB;
		}
		const titleA = a.title?.rendered || a.slug || '';
		const titleB = b.title?.rendered || b.slug || '';
		return titleA.localeCompare( titleB );
	}
	const nameA = a.name || a.slug || '';
	const nameB = b.name || b.slug || '';
	return nameA.localeCompare( nameB );
}

/**
 * Depth-first list with depth for indentation. Uses `parent` from REST (pages, hierarchical CPTs, categories).
 * Items whose parent is not in the current result set appear as roots of their own subtree.
 *
 * @param {Object[]|null|undefined} records    Current page of REST entities.
 * @param {'postType'|'taxonomy'}   entityKind
 * @return {{ record: Object, depth: number }[]} Ordered rows with nesting depth.
 */
export function flattenRecordsWithDepth( records, entityKind ) {
	if ( ! Array.isArray( records ) || records.length === 0 ) {
		return [];
	}

	/** @type {Map<number, Object[]>} */
	const childrenByParent = new Map();

	for ( const r of records ) {
		const p = getRecordParentId( r );
		if ( ! childrenByParent.has( p ) ) {
			childrenByParent.set( p, [] );
		}
		childrenByParent.get( p ).push( r );
	}

	for ( const [ , kids ] of childrenByParent ) {
		kids.sort( ( a, b ) => sortHierarchySiblings( a, b, entityKind ) );
	}

	const out = [];
	const visited = new Set();

	function walkNode( node, depth ) {
		if ( visited.has( node.id ) ) {
			return;
		}
		visited.add( node.id );
		out.push( { record: node, depth } );
		const kids = childrenByParent.get( node.id ) || [];
		for ( const child of kids ) {
			walkNode( child, depth + 1 );
		}
	}

	function walkFromParent( parentId, depth ) {
		const kids = childrenByParent.get( parentId ) || [];
		for ( const child of kids ) {
			walkNode( child, depth );
		}
	}

	walkFromParent( 0, 0 );

	// Subtrees whose parent is not in this page (parent missing from `records`).
	const sortedRest = records
		.filter( ( r ) => ! visited.has( r.id ) )
		.sort( ( a, b ) => sortHierarchySiblings( a, b, entityKind ) );

	for ( const r of sortedRest ) {
		if ( visited.has( r.id ) ) {
			continue;
		}
		walkNode( r, 0 );
	}

	return out;
}

/**
 * Prototype bulk picker: tabs + extra types/taxonomies, list with checkboxes, insert navigation links.
 *
 * @param {Object}   props
 * @param {string}   props.clientId         Placeholder navigation-link block to replace.
 * @param {Function} props.onBack           Return to main Link UI.
 * @param {Function} [props.onBulkComplete] Called after blocks are inserted (e.g. clear list-view state).
 */
export default function LinkUIAddMenuItems( {
	clientId,
	onBack,
	onBulkComplete,
} ) {
	const [ tab, setTab ] = useState( 'page' );
	/** @type {{ type: 'postType'|'taxonomy', slug: string }|null} */
	const [ extraSource, setExtraSource ] = useState( null );
	const [ searchInput, setSearchInput ] = useState( '' );
	const [ debouncedSearch, setDebouncedSearch ] = useState( '' );
	const [ listPage, setListPage ] = useState( 1 );
	/** @type {[ Array<Object>|null, Function ]} Pseudo-records from link search API, or null when not searching. */
	const [ searchRecords, setSearchRecords ] = useState( null );
	const [ isSearchResolving, setIsSearchResolving ] = useState( false );
	/** @type {[ Map<string, Object>, Function ]} key -> block attributes */
	const [ selectedByKey, setSelectedByKey ] = useState( () => new Map() );

	const { insertBlocks, removeBlock } = useDispatch( blockEditorStore );
	const getBlockRootClientId = useSelect(
		( select ) => select( blockEditorStore ).getBlockRootClientId,
		[]
	);
	const getBlockIndex = useSelect(
		( select ) => select( blockEditorStore ).getBlockIndex,
		[]
	);

	/** @type {undefined | ((search: string, searchOptions: Object) => Promise<Array>)} */
	const settingsFetchLinkSuggestions = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				?.__experimentalFetchLinkSuggestions,
		[]
	);

	const { postTypes, taxonomies } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );
		const pt = getEntityRecords( 'root', 'postType', {
			per_page: -1,
		} );
		const tx = getEntityRecords( 'root', 'taxonomy', {
			per_page: -1,
		} );
		return { postTypes: pt, taxonomies: tx };
	}, [] );

	const resolved = useMemo( () => {
		if ( extraSource ) {
			return {
				entityKind:
					extraSource.type === 'postType' ? 'postType' : 'taxonomy',
				entityName: extraSource.slug,
			};
		}
		const main = MAIN_TABS.find( ( t ) => t.id === tab );
		if ( main ) {
			return { entityKind: main.kind, entityName: tab };
		}
		return { entityKind: 'postType', entityName: 'page' };
	}, [ tab, extraSource ] );

	const isHierarchical = useSelect(
		( select ) => {
			const { getEntityRecord, hasFinishedResolution } =
				select( coreStore );
			const kind = resolved.entityKind;
			const name = resolved.entityName;
			if ( kind === 'postType' ) {
				const path = [ 'root', 'postType', name ];
				if ( ! hasFinishedResolution( 'getEntityRecord', path ) ) {
					return false;
				}
				const pt = getEntityRecord( ...path );
				return pt?.hierarchical === true;
			}
			if ( kind === 'taxonomy' ) {
				const path = [ 'root', 'taxonomy', name ];
				if ( ! hasFinishedResolution( 'getEntityRecord', path ) ) {
					return false;
				}
				const tx = getEntityRecord( ...path );
				return tx?.hierarchical === true;
			}
			return false;
		},
		[ resolved.entityKind, resolved.entityName ]
	);

	useEffect( () => {
		const id = setTimeout( () => {
			setDebouncedSearch( searchInput );
		}, 300 );
		return () => clearTimeout( id );
	}, [ searchInput ] );

	useEffect( () => {
		setListPage( 1 );
	}, [ debouncedSearch, resolved.entityKind, resolved.entityName ] );

	const isSearchActive = debouncedSearch.trim().length > 0;

	const listQuery = useMemo( () => {
		const q = {
			page: listPage,
			per_page: PER_PAGE,
			...( resolved.entityKind === 'postType'
				? { status: 'publish' }
				: {} ),
		};
		if ( isHierarchical && resolved.entityKind === 'postType' ) {
			q.orderby = 'menu_order';
			q.order = 'asc';
		} else if ( isHierarchical && resolved.entityKind === 'taxonomy' ) {
			q.orderby = 'name';
			q.order = 'asc';
		}
		return q;
	}, [ listPage, resolved.entityKind, isHierarchical ] );

	const { records, isResolving, totalPages } = useEntityRecords(
		resolved.entityKind,
		resolved.entityName,
		listQuery,
		{ enabled: ! isSearchActive }
	);

	useEffect( () => {
		const q = debouncedSearch.trim();
		if ( ! q ) {
			setSearchRecords( null );
			setIsSearchResolving( false );
			return;
		}

		let cancelled = false;
		setIsSearchResolving( true );
		setSearchRecords( null );

		const searchType = resolved.entityKind === 'postType' ? 'post' : 'term';

		const searchFn =
			settingsFetchLinkSuggestions ||
			( ( term, opts ) => fetchLinkSuggestions( term, opts, {} ) );

		searchFn( q, {
			type: searchType,
			subtype: resolved.entityName,
			page: listPage,
			perPage: PER_PAGE,
		} )
			.then( ( results ) => {
				if ( cancelled ) {
					return;
				}
				setSearchRecords(
					results.map( ( r ) =>
						searchResultToPseudoRecord( r, resolved.entityKind )
					)
				);
				setIsSearchResolving( false );
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setSearchRecords( [] );
					setIsSearchResolving( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [
		debouncedSearch,
		resolved.entityKind,
		resolved.entityName,
		listPage,
		settingsFetchLinkSuggestions,
	] );

	const dropdownOptions = useMemo( () => {
		const opts = [ { label: __( 'More types…' ), value: '' } ];
		if ( Array.isArray( postTypes ) ) {
			postTypes.forEach( ( pt ) => {
				if ( ! pt?.slug ) {
					return;
				}
				if ( MAIN_TAB_SLUGS.has( pt.slug ) ) {
					return;
				}
				if ( pt.viewable === false ) {
					return;
				}
				opts.push( {
					label: pt.name || pt.slug,
					value: `pt:${ pt.slug }`,
				} );
			} );
		}
		if ( Array.isArray( taxonomies ) ) {
			taxonomies.forEach( ( tax ) => {
				if ( ! tax?.slug ) {
					return;
				}
				if ( MAIN_TAB_SLUGS.has( tax.slug ) ) {
					return;
				}
				if ( tax.visibility?.public === false ) {
					return;
				}
				opts.push( {
					label: tax.name || tax.slug,
					value: `tax:${ tax.slug }`,
				} );
			} );
		}
		return opts;
	}, [ postTypes, taxonomies ] );

	const dropdownValue = useMemo( () => {
		if ( ! extraSource ) {
			return '';
		}
		const prefix = extraSource.type === 'postType' ? 'pt' : 'tax';
		return `${ prefix }:${ extraSource.slug }`;
	}, [ extraSource ] );

	const toggleRow = useCallback(
		( record ) => {
			const key = selectionKey(
				resolved.entityKind,
				resolved.entityName,
				record.id
			);
			setSelectedByKey( ( prev ) => {
				const next = new Map( prev );
				if ( next.has( key ) ) {
					next.delete( key );
				} else {
					next.set(
						key,
						recordToNavigationLinkAttributes(
							record,
							resolved.entityKind,
							resolved.entityName
						)
					);
				}
				return next;
			} );
		},
		[ resolved.entityKind, resolved.entityName ]
	);

	const isRowSelected = useCallback(
		( record ) =>
			selectedByKey.has(
				selectionKey(
					resolved.entityKind,
					resolved.entityName,
					record.id
				)
			),
		[ selectedByKey, resolved.entityKind, resolved.entityName ]
	);

	const clearSelection = useCallback( () => {
		setSelectedByKey( new Map() );
	}, [] );

	const handleAdd = useCallback( () => {
		if ( ! clientId || selectedByKey.size === 0 ) {
			return;
		}

		const rootClientId = getBlockRootClientId( clientId );
		const index = getBlockIndex( clientId );

		if (
			rootClientId === undefined ||
			rootClientId === null ||
			index < 0
		) {
			return;
		}

		const blocks = [];
		for ( const attrs of selectedByKey.values() ) {
			blocks.push( createBlock( 'core/navigation-link', attrs ) );
		}

		if ( ! blocks.length ) {
			return;
		}

		removeBlock( clientId, false );
		insertBlocks( blocks, index, rootClientId, false );
		clearSelection();
		if ( onBulkComplete ) {
			onBulkComplete();
		}
		onBack();
	}, [
		clientId,
		selectedByKey,
		getBlockRootClientId,
		getBlockIndex,
		insertBlocks,
		removeBlock,
		clearSelection,
		onBulkComplete,
		onBack,
	] );

	const onTabsSelect = useCallback( ( newTabId ) => {
		setExtraSource( null );
		setTab( newTabId );
	}, [] );

	const onDropdownChange = ( value ) => {
		if ( ! value ) {
			setExtraSource( null );
			return;
		}
		const [ prefix, slug ] = value.split( ':' );
		if ( prefix === 'pt' ) {
			setExtraSource( { type: 'postType', slug } );
		} else if ( prefix === 'tax' ) {
			setExtraSource( { type: 'taxonomy', slug } );
		}
	};

	const count = selectedByKey.size;

	const list = useMemo( () => {
		if ( isSearchActive ) {
			return searchRecords ?? [];
		}
		return records || [];
	}, [ isSearchActive, searchRecords, records ] );

	const listLoading = isSearchActive ? isSearchResolving : isResolving;

	const searchHasNextPage =
		isSearchActive &&
		Array.isArray( searchRecords ) &&
		searchRecords.length === PER_PAGE;

	/** When core-data has not stored X-WP-Total yet, `totalPages` is null; use a full page as “maybe more”. */
	const browseHasNextPage =
		! isSearchActive &&
		Array.isArray( records ) &&
		( typeof totalPages === 'number' && totalPages > 0
			? listPage < totalPages
			: records.length === PER_PAGE );

	const displayRows = useMemo( () => {
		if ( isSearchActive || ! isHierarchical || list.length === 0 ) {
			return list.map( ( record ) => ( { record, depth: 0 } ) );
		}
		return flattenRecordsWithDepth( list, resolved.entityKind );
	}, [ list, isHierarchical, resolved.entityKind, isSearchActive ] );

	let pageIndicator;
	if ( isSearchActive ) {
		pageIndicator = sprintf(
			// translators: %d: current page number (search has no total page count from API).
			__( 'Page %d' ),
			listPage
		);
	} else if ( totalPages ) {
		pageIndicator = sprintf(
			// translators: %1$d current page, %2$d total pages.
			__( 'Page %1$d of %2$d' ),
			listPage,
			totalPages
		);
	} else {
		pageIndicator = `${ listPage }`;
	}

	const nextPageDisabled = isSearchActive
		? ! searchHasNextPage
		: ! browseHasNextPage;

	const extraSourcePanelLabel = useMemo( () => {
		if ( ! extraSource ) {
			return '';
		}
		const opt = dropdownOptions.find(
			( o ) =>
				o.value ===
				`${ extraSource.type === 'postType' ? 'pt' : 'tax' }:${
					extraSource.slug
				}`
		);
		return opt?.label || extraSource.slug;
	}, [ extraSource, dropdownOptions ] );

	const renderListSection = () => (
		<VStack
			expanded
			justify="flex-start"
			spacing={ 4 }
			className="link-ui-add-menu-items__panel-inner"
		>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				hideLabelFromVision
				label={ __( 'Search' ) }
				value={ searchInput }
				onChange={ setSearchInput }
				placeholder={ __( 'Filter…' ) }
			/>

			<div className="link-ui-add-menu-items__list">
				{ listLoading && ! list.length ? (
					<Spinner />
				) : (
					<VStack spacing={ 3 }>
						{ displayRows.map( ( { record, depth } ) => (
							<div
								key={ record.id }
								className="link-ui-add-menu-items__row"
								style={ {
									paddingInlineStart:
										CHECKBOX_FOCUS_INSET + depth * 24,
								} }
							>
								<CheckboxControl
									__nextHasNoMarginBottom
									label={
										resolved.entityKind === 'postType'
											? decodeEntities(
													record.title?.rendered ||
														`#${ record.id }`
											  )
											: decodeEntities(
													record.name ||
														`#${ record.id }`
											  )
									}
									checked={ isRowSelected( record ) }
									onChange={ () => toggleRow( record ) }
								/>
							</div>
						) ) }
						{ ! list.length && ! listLoading ? (
							<p className="link-ui-add-menu-items__empty">
								{ __( 'No items found.' ) }
							</p>
						) : null }
					</VStack>
				) }
			</div>

			<HStack justify="space-between">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ () =>
						setListPage( ( p ) => Math.max( 1, p - 1 ) )
					}
					disabled={ listPage <= 1 }
					accessibleWhenDisabled
				>
					{ __( 'Previous page' ) }
				</Button>
				<span className="link-ui-add-menu-items__page">
					{ pageIndicator }
				</span>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ () => setListPage( ( p ) => p + 1 ) }
					disabled={ nextPageDisabled }
					accessibleWhenDisabled
				>
					{ __( 'Next page' ) }
				</Button>
			</HStack>

			<HStack justify="space-between">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ clearSelection }
					disabled={ count === 0 }
					accessibleWhenDisabled
				>
					{ __( 'Clear selection' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ handleAdd }
					disabled={ count === 0 }
					accessibleWhenDisabled
				>
					{ sprintf(
						// translators: %d: number of items.
						__( 'Add %d items to menu' ),
						count
					) }
				</Button>
			</HStack>
		</VStack>
	);

	return (
		<Modal
			className="link-ui-add-menu-items-modal"
			title={ __( 'Add menu items' ) }
			onRequestClose={ onBack }
			size="large"
			focusOnMount="firstContentElement"
			shouldCloseOnClickOutside
			shouldCloseOnEsc
		>
			<div className="link-ui-add-menu-items__tabs-shell">
				<Tabs
					orientation="horizontal"
					defaultTabId="page"
					selectedTabId={ extraSource ? null : tab }
					onSelect={ onTabsSelect }
				>
					<div className="link-ui-add-menu-items__tab-row-inner">
						<Tabs.TabList className="link-ui-add-menu-items__tab-list">
							{ MAIN_TABS.map( ( t ) => (
								<Tabs.Tab key={ t.id } tabId={ t.id }>
									{ t.label }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							className="link-ui-add-menu-items__type-dropdown"
							variant="minimal"
							hideLabelFromVision
							value={ dropdownValue }
							options={ dropdownOptions }
							onChange={ onDropdownChange }
							label={ __( 'Other content types' ) }
						/>
					</div>

					{ extraSource ? (
						<div
							role="tabpanel"
							className="link-ui-add-menu-items__panel link-ui-add-menu-items__panel--extra"
							aria-label={
								extraSourcePanelLabel
									? sprintf(
											// translators: %s: content type name.
											__( 'List for %s' ),
											extraSourcePanelLabel
									  )
									: __( 'Other content type' )
							}
						>
							{ renderListSection() }
						</div>
					) : (
						MAIN_TABS.map( ( t ) => (
							<Tabs.TabPanel
								key={ t.id }
								tabId={ t.id }
								focusable={ false }
							>
								{ renderListSection() }
							</Tabs.TabPanel>
						) )
					) }
				</Tabs>
			</div>
		</Modal>
	);
}
