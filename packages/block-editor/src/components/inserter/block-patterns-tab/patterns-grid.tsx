import type { ReactNode } from 'react';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { cloneBlock } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { getScrollContainer } from '@wordpress/dom';
import { DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';
import BlockPreview from '../../block-preview';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { searchItems } from '../../../utils/search-ranking';
import usePatternsState from '../hooks/use-patterns-state';
import MediaSearch from '../media-tab/media-search';
import InserterNoResults from '../no-results';
import {
	allPatternsCategory,
	getCategoriesBySource,
	isPatternFiltered,
	isPatternInCategory,
	INSERTER_PATTERN_TYPES,
	INSERTER_SYNC_TYPES,
} from './utils';
import type { BlockPattern } from '../../../store/types';
import type { InsertPattern, PatternCategory } from '../types';

type PatternsGridProps = {
	/**
	 * The categories with patterns, "All" included.
	 */
	categories: PatternCategory[];
	/**
	 * The category to start on. The grid owns the selection afterwards and
	 * reports it through `onSelectCategory`.
	 */
	initialCategory?: PatternCategory | null;
	onSelectCategory: ( category: PatternCategory | undefined ) => void;
	onInsert: InsertPattern;
	rootClientId?: string | null;
	/**
	 * Rendered beneath the pager (the "Explore all patterns" button).
	 */
	footer?: ReactNode;
};

// The same page size as the paged list this grid replaces.
const PATTERNS_PER_PAGE = 20;

// Wider than half the sidebar, so the grid has a single column of previews.
const GRID_LAYOUT = { previewSize: 230 } as const;
const DEFAULT_LAYOUTS = { grid: { layout: GRID_LAYOUT } };

// The categories are shown as tabs, so the menu leaves them out. A source is
// always selected, so its group in the menu has no "All" option.
const MENU_EXCLUDED_FIELDS = [ 'category' ];
const MENU_REQUIRED_FIELDS = [ 'source' ];

// Where patterns come from, the default first. The patterns that themes and
// plugins register are one source, whatever registered them.
const getSourceOptions = () => [
	{
		value: INSERTER_PATTERN_TYPES.theme,
		label: __( 'Theme & Plugins' ),
	},
	{
		value: INSERTER_PATTERN_TYPES.directory,
		label: __( 'Pattern Directory' ),
	},
	{
		value: INSERTER_PATTERN_TYPES.user,
		label: __( 'User' ),
	},
];

const NO_CATEGORIES: PatternCategory[] = [];

type Filters = NonNullable< View[ 'filters' ] >;

const getFilterValue = ( filters: Filters | undefined, field: string ) =>
	filters?.find( ( filter ) => filter.field === field )?.value;

/**
 * With a category selected, the inserted blocks keep only that category in
 * their metadata, as the list this grid replaces did: pattern shuffling reads
 * it to stay within the category the pattern was picked from.
 *
 * @param blocks   The blocks of the pattern.
 * @param category The name of the selected category, or none for "All".
 * @return The blocks to insert.
 */
function getBlocksForCategory(
	blocks: Block[] | undefined,
	category: string | undefined
) {
	if ( ! category ) {
		return blocks ?? [];
	}
	return ( blocks ?? [] ).map( ( block ) => {
		const clonedBlock = cloneBlock( block );
		const metadata = clonedBlock.attributes.metadata as
			{ categories?: string[] } | undefined;
		if ( metadata?.categories?.includes( category ) ) {
			metadata.categories = [ category ];
		}
		return clonedBlock;
	} );
}

function PatternPreview( {
	pattern,
	category,
}: {
	pattern: BlockPattern;
	category?: string;
} ) {
	const draggedBlocks = useMemo(
		() => getBlocksForCategory( pattern.blocks, category ),
		[ pattern.blocks, category ]
	);

	// The card's media area is the click-to-insert target (a DataViews click
	// wrapper); the preview inside it is what gets dragged onto the canvas.
	return (
		<InserterDraggableBlocks
			isEnabled
			blocks={ draggedBlocks }
			pattern={ pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-inserter__patterns-grid__preview"
					draggable={ draggable }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
				>
					<BlockPreview.Async
						placeholder={
							<div className="block-editor-inserter__patterns-grid__placeholder" />
						}
					>
						<BlockPreview
							blocks={ pattern.blocks }
							// The pattern registry leaves the width untyped.
							viewportWidth={
								pattern.viewportWidth as number | undefined
							}
						/>
					</BlockPreview.Async>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

/**
 * The Patterns tab body: one DataViews grid with the search and the settings
 * menu above, the pattern categories as tabs, and a pager below. It is composed
 * from the same DataViews sub-components as the Media tab, so the two tabs
 * browse alike: a source is chosen in the menu, with one of them as the
 * default, and the tabs are what that source holds.
 *
 * Everything shown is what is registered: the patterns and the categories that
 * themes and plugins add reach the grid and the tabs with no further work.
 */
export default function PatternsGrid( {
	categories,
	initialCategory,
	onSelectCategory,
	onInsert,
	rootClientId,
	footer,
}: PatternsGridProps ) {
	const panelRef = useRef< HTMLDivElement >( null );
	const [ search, setSearch ] = useState( '' );
	const [ page, setPage ] = useState( 1 );
	// What the menu and the tabs last asked for. What is shown is worked out
	// below, since a selection can stop being available.
	const [ selectedSource, setSelectedSource ] = useState< string >(
		INSERTER_PATTERN_TYPES.theme
	);
	const [ selectedCategory, setSelectedCategory ] = useState<
		string | undefined
	>( initialCategory?.name );
	const [ selectedType, setSelectedType ] = useState< string >();

	const [ allPatterns, , onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId
	);

	// The sources with patterns, and the categories each of them fills. A
	// source without patterns isn't offered, and a category shows as a tab only
	// under the sources that have patterns in it, so no choice leads to an
	// empty list.
	const { sources, categoriesBySource } = useMemo( () => {
		const bySource = getCategoriesBySource( allPatterns, categories );
		return {
			sources: getSourceOptions().filter( ( { value } ) =>
				bySource.has( value )
			),
			categoriesBySource: bySource,
		};
	}, [ allPatterns, categories ] );

	// The default source is "Theme & Plugins", or the first one with patterns.
	const source: string | undefined = (
		sources.find( ( { value } ) => value === selectedSource ) ??
		sources[ 0 ]
	)?.value;
	const hasSources = sources.length > 1;
	const tabCategories =
		( source && categoriesBySource.get( source ) ) || NO_CATEGORIES;
	// Without a category, or with one the source doesn't have, the tab is
	// "All".
	const category = tabCategories.some(
		( { name } ) => name === selectedCategory
	)
		? selectedCategory
		: undefined;
	// Only the patterns made on this site can be synced.
	const hasTypes = source === INSERTER_PATTERN_TYPES.user;
	const syncStatus = hasTypes ? selectedType : undefined;

	// The grid only shows what it is given: the filtering keeps the rules
	// and the search ranking the inserter already had for patterns.
	const patterns = useMemo( () => {
		const inCategory = allPatterns.filter(
			( pattern: BlockPattern ) =>
				! isPatternFiltered(
					pattern,
					source ?? 'all',
					syncStatus ?? 'all'
				) && isPatternInCategory( pattern, category, categories )
		);
		return search ? searchItems( inCategory, search ) : inCategory;
	}, [ allPatterns, source, syncStatus, category, categories, search ] );

	const totalPages = Math.max(
		1,
		Math.ceil( patterns.length / PATTERNS_PER_PAGE )
	);
	const currentPage = Math.min( page, totalPages );
	const pagePatterns = useMemo(
		() =>
			patterns.slice(
				( currentPage - 1 ) * PATTERNS_PER_PAGE,
				currentPage * PATTERNS_PER_PAGE
			),
		[ patterns, currentPage ]
	);
	const paginationInfo = useMemo(
		() => ( { totalItems: patterns.length, totalPages } ),
		[ patterns.length, totalPages ]
	);

	const view: View = useMemo(
		() => ( {
			type: 'grid',
			page: currentPage,
			perPage: PATTERNS_PER_PAGE,
			search,
			filters: [
				...( hasSources && source
					? [
							{
								field: 'source',
								operator: 'is' as const,
								value: source,
							},
						]
					: [] ),
				...( category
					? [
							{
								field: 'category',
								operator: 'isAny' as const,
								value: [ category ],
							},
						]
					: [] ),
				...( syncStatus
					? [
							{
								field: 'syncStatus',
								operator: 'is' as const,
								value: syncStatus,
							},
						]
					: [] ),
			],
			fields: [],
			titleField: 'title',
			mediaField: 'preview',
			showTitle: false,
			showMedia: true,
			layout: GRID_LAYOUT,
		} ),
		[ currentPage, search, hasSources, source, category, syncStatus ]
	);

	const fields: Field< BlockPattern >[] = useMemo(
		() => [
			{
				id: 'preview',
				label: __( 'Preview' ),
				type: 'media',
				render: ( { item } ) => (
					<PatternPreview pattern={ item } category={ category } />
				),
				enableSorting: false,
			},
			{
				// Hidden from the card but used as its accessible name.
				id: 'title',
				label: __( 'Title' ),
				type: 'text',
				getValue: ( { item } ) => item.title ?? item.name,
				enableSorting: false,
				enableGlobalSearch: false,
				filterBy: false,
			},
			// The source, category and type are modelled as filters so they
			// live in the view, where the menu and the tabs read and change
			// them. The filtering itself happens above.
			{
				id: 'source',
				label: __( 'Source' ),
				type: 'text',
				getValue: ( { item } ) => item.source ?? '',
				elements: hasSources ? sources : undefined,
				filterBy: hasSources ? { operators: [ 'is' ] } : false,
				enableSorting: false,
				enableGlobalSearch: false,
			},
			{
				id: 'category',
				label: __( 'Categories' ),
				type: 'array',
				getValue: ( { item } ) => item.categories ?? [],
				elements: tabCategories.map( ( { name, label } ) => ( {
					value: name,
					label,
				} ) ),
				filterBy: { operators: [ 'isAny' ] },
				enableSorting: false,
				enableGlobalSearch: false,
			},
			{
				id: 'syncStatus',
				label: __( 'Type' ),
				type: 'text',
				getValue: ( { item } ) => item.syncStatus ?? '',
				elements: hasTypes
					? [
							{
								value: INSERTER_SYNC_TYPES.full,
								label: _x( 'Synced', 'patterns' ),
							},
							{
								value: INSERTER_SYNC_TYPES.unsynced,
								label: _x( 'Not synced', 'patterns' ),
							},
						]
					: undefined,
				filterBy: hasTypes ? { operators: [ 'is' ] } : false,
				enableSorting: false,
				enableGlobalSearch: false,
			},
		],
		[ hasSources, sources, tabCategories, hasTypes, category ]
	);

	// Start from the top whenever the results change (another page, tab,
	// filter or search), rather than wherever the previous ones were scrolled
	// to. It runs once the new results are in place, so nothing they do while
	// rendering moves the list again. The patterns scroll inside the panel, in
	// whichever element around the grid does the scrolling. `scrollTo` is
	// guarded because jsdom leaves it undefined.
	useEffect( () => {
		const grid = panelRef.current?.querySelector< HTMLElement >(
			'.block-editor-inserter__media-grid'
		);
		getScrollContainer( grid ?? panelRef.current )?.scrollTo?.( 0, 0 );
	}, [ currentPage, category, source, syncStatus, search ] );

	const onChangeView = useCallback(
		( nextView: View ) => {
			const nextSource: string | undefined =
				getFilterValue( nextView.filters, 'source' ) ?? source;
			// A category the next source doesn't have falls back to "All".
			const requestedCategory: string | undefined = getFilterValue(
				nextView.filters,
				'category'
			)?.[ 0 ];
			const nextCategory = (
				( nextSource && categoriesBySource.get( nextSource ) ) ||
				NO_CATEGORIES
			).some( ( { name } ) => name === requestedCategory )
				? requestedCategory
				: undefined;

			if ( nextSource ) {
				setSelectedSource( nextSource );
			}
			setSelectedCategory( nextCategory );
			setSelectedType(
				nextSource === INSERTER_PATTERN_TYPES.user
					? getFilterValue( nextView.filters, 'syncStatus' )
					: undefined
			);
			setPage( nextView.page ?? 1 );

			if ( nextCategory !== category ) {
				onSelectCategory(
					categories.find(
						( { name } ) =>
							name ===
							( nextCategory ?? allPatternsCategory.name )
					)
				);
			}
		},
		[ source, category, categories, categoriesBySource, onSelectCategory ]
	);

	const onChangeSearch = useCallback( ( value: string ) => {
		setSearch( value );
		setPage( 1 );
	}, [] );

	const showPagination = totalPages > 1;
	const hasFooter = showPagination || !! footer;
	const firstItem = ( currentPage - 1 ) * PATTERNS_PER_PAGE + 1;

	return (
		<div
			ref={ panelRef }
			className="block-editor-inserter__media-panel block-editor-inserter__patterns-panel"
		>
			<DataViews
				data={ pagePatterns }
				fields={ fields }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ ( pattern ) => pattern.name }
				onClickItem={ ( pattern ) =>
					onClickPattern(
						pattern,
						getBlocksForCategory( pattern.blocks, category )
					)
				}
				empty={ <InserterNoResults /> }
			>
				<Stack
					direction="row"
					align="center"
					gap="sm"
					className="block-editor-inserter__media-grid__search"
				>
					<MediaSearch
						label={ __( 'Search' ) }
						defaultValue={ search }
						onChange={ onChangeSearch }
					/>
					<DataViews.ViewMenu
						excludeFields={ MENU_EXCLUDED_FIELDS }
						requiredFields={ MENU_REQUIRED_FIELDS }
						size="default"
					/>
				</Stack>
				<DataViews.FilterTabs
					field="category"
					allLabel={ allPatternsCategory.label }
				>
					<DataViews.Layout className="block-editor-inserter__media-grid" />
				</DataViews.FilterTabs>
				{ hasFooter && (
					<Stack
						direction="column"
						gap="lg"
						className="block-editor-inserter__media-grid__footer"
					>
						{ showPagination && (
							<Stack
								direction="row"
								justify="space-between"
								align="center"
								gap="sm"
							>
								<span className="block-editor-inserter__media-grid__range">
									{ sprintf(
										/* translators: 1: The first item shown on the page. 2: The last item shown on the page. 3: The total number of items. */
										__( '%1$d–%2$d of %3$d' ),
										firstItem,
										Math.min(
											currentPage * PATTERNS_PER_PAGE,
											patterns.length
										),
										patterns.length
									) }
								</span>
								<DataViews.Pagination />
							</Stack>
						) }
						{ footer }
					</Stack>
				) }
			</DataViews>
		</div>
	);
}
