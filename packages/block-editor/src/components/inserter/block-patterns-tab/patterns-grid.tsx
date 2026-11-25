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
import { getScrollContainer } from '@wordpress/dom';
import { DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';
import BlockPreview from '../../block-preview';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import { searchItems } from '../../../utils/search-ranking';
import usePatternsState from '../hooks/use-patterns-state';
import MediaSearch from '../media-tab/media-search';
import InserterNoResults from '../no-results';
import {
	allPatternsCategory,
	isPatternFiltered,
	sitePatternsCategory,
	starterPatternsCategory,
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

// The categories are shown as tabs, so the menu leaves them out.
const MENU_EXCLUDED_FIELDS = [ 'category' ];

type Filters = NonNullable< View[ 'filters' ] >;

const getFilterValue = ( filters: Filters | undefined, field: string ) =>
	filters?.find( ( filter ) => filter.field === field )?.value;

/**
 * Whether a pattern belongs to a category, including the ones that aren't
 * registered categories: "All", the site's own patterns, starter content and
 * the patterns left without a category.
 *
 * @param pattern    The pattern to check.
 * @param category   The name of the category, or none for "All".
 * @param categories The categories with patterns.
 * @return Whether the pattern belongs to the category.
 */
function isPatternInCategory(
	pattern: BlockPattern,
	category: string | undefined,
	categories: PatternCategory[]
) {
	if ( ! category || category === allPatternsCategory.name ) {
		return true;
	}
	if ( category === sitePatternsCategory.name ) {
		return pattern.type === INSERTER_PATTERN_TYPES.user;
	}
	if ( category === starterPatternsCategory.name ) {
		return !! pattern.blockTypes?.includes( 'core/post-content' );
	}
	if ( category === 'uncategorized' ) {
		return ! pattern.categories?.some( ( name ) =>
			categories.some( ( { name: available } ) => available === name )
		);
	}
	return !! pattern.categories?.includes( category );
}

function PatternPreview( {
	pattern,
	category,
}: {
	pattern: BlockPattern;
	category?: string;
} ) {
	// With a category selected, the dragged blocks keep only that category in
	// their metadata, as the list this grid replaces did: pattern shuffling
	// reads it to stay within the category the pattern was picked from.
	const draggedBlocks = useMemo( () => {
		if ( ! category ) {
			return pattern.blocks ?? [];
		}
		return ( pattern.blocks ?? [] ).map( ( block ) => {
			const clonedBlock = cloneBlock( block );
			const metadata = clonedBlock.attributes.metadata as
				{ categories?: string[] } | undefined;
			if ( metadata?.categories?.includes( category ) ) {
				metadata.categories = [ category ];
			}
			return clonedBlock;
		} );
	}, [ pattern.blocks, category ] );

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
 * browse alike.
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
	// Category, source and type, as the tabs and the menu write them.
	const [ filters, setFilters ] = useState< Filters >( () =>
		initialCategory && initialCategory.name !== allPatternsCategory.name
			? [
					{
						field: 'category',
						operator: 'isAny',
						value: [ initialCategory.name ],
					},
				]
			: []
	);

	const category: string | undefined = getFilterValue(
		filters,
		'category'
	)?.[ 0 ];
	const source: string = getFilterValue( filters, 'source' ) ?? 'all';
	const syncStatus: string = getFilterValue( filters, 'syncStatus' ) ?? 'all';

	const [ allPatterns, , onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId,
		category
	);

	// The grid only shows what it is given: the filtering keeps the rules
	// and the search ranking the inserter already had for patterns.
	const patterns = useMemo( () => {
		const inCategory = allPatterns.filter(
			( pattern: BlockPattern ) =>
				! isPatternFiltered( pattern, source, syncStatus ) &&
				isPatternInCategory( pattern, category, categories )
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
			filters,
			fields: [],
			titleField: 'title',
			mediaField: 'preview',
			showTitle: false,
			showMedia: true,
			layout: GRID_LAYOUT,
		} ),
		[ currentPage, search, filters ]
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
			// The category, source and type are modelled as filters so they
			// live in the view, where the tabs and the menu read and change
			// them. The filtering itself happens above.
			{
				id: 'category',
				label: __( 'Categories' ),
				type: 'array',
				getValue: ( { item } ) => item.categories ?? [],
				elements: categories
					.filter( ( { name } ) => name !== allPatternsCategory.name )
					.map( ( { name, label } ) => ( { value: name, label } ) ),
				filterBy: { operators: [ 'isAny' ] },
				enableSorting: false,
				enableGlobalSearch: false,
			},
			{
				id: 'source',
				label: __( 'Source' ),
				type: 'text',
				getValue: ( { item } ) => item.source ?? '',
				elements: [
					{
						value: INSERTER_PATTERN_TYPES.directory,
						label: __( 'Pattern Directory' ),
					},
					{
						value: INSERTER_PATTERN_TYPES.theme,
						label: __( 'Theme & Plugins' ),
					},
					{
						value: INSERTER_PATTERN_TYPES.user,
						label: __( 'User' ),
					},
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
				enableGlobalSearch: false,
			},
			{
				id: 'syncStatus',
				label: __( 'Type' ),
				type: 'text',
				getValue: ( { item } ) => item.syncStatus ?? '',
				elements: [
					{
						value: INSERTER_SYNC_TYPES.full,
						label: _x( 'Synced', 'patterns' ),
					},
					{
						value: INSERTER_SYNC_TYPES.unsynced,
						label: _x( 'Not synced', 'patterns' ),
					},
				],
				filterBy: { operators: [ 'is' ] },
				enableSorting: false,
				enableGlobalSearch: false,
			},
		],
		[ categories, category ]
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
			let nextFilters = nextView.filters ?? [];
			// Only patterns made on this site can be synced, so the type
			// doesn't outlive a change to a source without them.
			const nextSource = getFilterValue( nextView.filters, 'source' );
			if (
				nextSource !== source &&
				( nextSource === INSERTER_PATTERN_TYPES.theme ||
					nextSource === INSERTER_PATTERN_TYPES.directory )
			) {
				nextFilters = nextFilters.filter(
					( filter ) => filter.field !== 'syncStatus'
				);
			}
			setFilters( nextFilters );

			const nextCategory: string | undefined = getFilterValue(
				nextView.filters,
				'category'
			)?.[ 0 ];
			if ( nextCategory !== category ) {
				onSelectCategory(
					categories.find(
						( { name } ) =>
							name ===
							( nextCategory ?? allPatternsCategory.name )
					)
				);
			}

			setPage( nextView.page ?? 1 );
		},
		[ source, category, categories, onSelectCategory ]
	);

	const onChangeSearch = useCallback( ( value: string ) => {
		setSearch( value );
		setPage( 1 );
	}, [] );

	const onReset = useCallback( () => {
		setFilters( [] );
		setPage( 1 );
		onSelectCategory(
			categories.find( ( { name } ) => name === allPatternsCategory.name )
		);
	}, [ categories, onSelectCategory ] );

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
					onClickPattern( pattern, pattern.blocks )
				}
				empty={ <InserterNoResults /> }
				onReset={ filters.length > 0 ? onReset : false }
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
						size="default"
					>
						<Menu.LinkItem
							href={ __( 'https://wordpress.org/patterns/' ) }
							openInNewTab
						>
							<Menu.ItemLabel>
								{ __( 'About pattern sources' ) }
							</Menu.ItemLabel>
						</Menu.LinkItem>
					</DataViews.ViewMenu>
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
