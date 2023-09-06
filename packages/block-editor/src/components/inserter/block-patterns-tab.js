/**
 * WordPress dependencies
 */
import {
	useMemo,
	useState,
	useCallback,
	useRef,
	useEffect,
} from '@wordpress/element';
import { _x, __, isRTL } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
	SelectControl,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';
import PatternsExplorerModal from './block-patterns-explorer/explorer';
import MobileTabNavigation from './mobile-tab-navigation';
import BlockPatternsPaging from '../block-patterns-paging';
import usePatternsPaging from './hooks/use-patterns-paging';

const noop = () => {};

export const allPatternsCategory = {
	name: 'allPatterns',
	label: __( 'All' ),
};
const PATTERN_TYPES = {
	synced: 'synced',
	unsynced: 'unsynced',
	theme: 'theme',
};
const SYNC_FILTERS = [
	{ value: 'all', label: __( 'Unfiltered' ) },
	{ value: PATTERN_TYPES.theme, label: __( 'Theme patterns' ) },
	{ value: PATTERN_TYPES.synced, label: __( 'My synced patterns' ) },
	{ value: PATTERN_TYPES.unsynced, label: __( 'My standard patterns' ) },
];
function usePatternsCategories( rootClientId, filter = 'all' ) {
	const { patterns: allPatterns, allCategories } = usePatternsState(
		undefined,
		rootClientId
	);
	const filteredPatterns =
		filter === 'all'
			? allPatterns
			: allPatterns.filter(
					( pattern ) =>
						( filter === PATTERN_TYPES.unsynced &&
							pattern.syncStatus === filter ) ||
						( filter === PATTERN_TYPES.synced &&
							pattern.syncStatus === '' ) ||
						( filter === PATTERN_TYPES.theme &&
							! pattern.name.startsWith( 'core/block' ) )
			  );
	const hasRegisteredCategory = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return false;
			}

			return pattern.categories.some( ( cat ) =>
				allCategories.some( ( category ) => category.name === cat )
			);
		},
		[ allCategories ]
	);

	// Remove any empty categories.
	const populatedCategories = useMemo( () => {
		const categories = allCategories
			.filter( ( category ) =>
				filteredPatterns.some( ( pattern ) =>
					pattern.categories?.includes( category.name )
				)
			)
			.sort( ( a, b ) => a.label.localeCompare( b.label ) );

		if (
			filteredPatterns.some(
				( pattern ) => ! hasRegisteredCategory( pattern )
			) &&
			! categories.find(
				( category ) => category.name === 'uncategorized'
			)
		) {
			categories.push( {
				name: 'uncategorized',
				label: _x( 'Uncategorized' ),
			} );
		}
		if ( filteredPatterns.length > 0 ) {
			categories.unshift( {
				name: allPatternsCategory.name,
				label: allPatternsCategory.label,
			} );
		}

		return categories;
	}, [ allCategories, filteredPatterns, hasRegisteredCategory ] );

	return populatedCategories;
}

export function BlockPatternsCategoryDialog( {
	rootClientId,
	onInsert,
	onHover,
	category,
	showTitlesAsTooltip,
	patternFilter,
} ) {
	const container = useRef();

	useEffect( () => {
		const timeout = setTimeout( () => {
			const [ firstTabbable ] = focus.tabbable.find( container.current );
			firstTabbable?.focus();
		} );
		return () => clearTimeout( timeout );
	}, [ category ] );

	return (
		<div
			ref={ container }
			className="block-editor-inserter__patterns-category-dialog"
		>
			<BlockPatternsCategoryPanel
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				onHover={ onHover }
				category={ category }
				showTitlesAsTooltip={ showTitlesAsTooltip }
				patternFilter={ patternFilter }
			/>
		</div>
	);
}

export function BlockPatternsCategoryPanel( {
	rootClientId,
	onInsert,
	onHover = noop,
	category,
	showTitlesAsTooltip,
	patternFilter,
} ) {
	const { patterns: allPatterns, onClickPattern } = usePatternsState(
		onInsert,
		rootClientId
	);
	const availableCategories = usePatternsCategories( rootClientId );
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) => {
				if (
					patternFilter === PATTERN_TYPES.theme &&
					pattern.name.startsWith( 'core/block' )
				) {
					return false;
				}
				if (
					patternFilter === PATTERN_TYPES.synced &&
					pattern.syncStatus !== ''
				) {
					return false;
				}
				if (
					patternFilter === PATTERN_TYPES.unsynced &&
					pattern.syncStatus !== PATTERN_TYPES.unsynced
				) {
					return false;
				}
				if ( category.name === allPatternsCategory.name ) {
					return true;
				}
				if ( category.name !== 'uncategorized' ) {
					return pattern.categories?.includes( category.name );
				}

				// The uncategorized category should show all the patterns without any category
				// or with no available category.
				const availablePatternCategories =
					pattern.categories?.filter( ( cat ) =>
						availableCategories.find(
							( availableCategory ) =>
								availableCategory.name === cat
						)
					) ?? [];

				return availablePatternCategories.length === 0;
			} ),
		[ allPatterns, availableCategories, category.name, patternFilter ]
	);

	const {
		totalItems,
		categoryPatterns,
		categoryPatternsAsyncList,
		numPages,
		changePage,
		currentPage,
	} = usePatternsPaging(
		currentCategoryPatterns,
		category,
		'.block-editor-inserter__patterns-category-dialog'
	);

	// Hide block pattern preview on unmount.
	useEffect( () => () => onHover( null ), [] );

	if ( ! currentCategoryPatterns.length ) {
		return null;
	}

	return (
		<div className="block-editor-inserter__patterns-category-panel">
			<div className="block-editor-inserter__patterns-category-panel-title">
				{ category.label }
			</div>
			<p>{ category.description }</p>
			<BlockPatternList
				shownPatterns={ categoryPatternsAsyncList }
				blockPatterns={ categoryPatterns }
				onClickPattern={ onClickPattern }
				onHover={ onHover }
				label={ category.label }
				orientation="vertical"
				category={ category.name }
				isDraggable
				showTitlesAsTooltip={ showTitlesAsTooltip }
			/>
			{ numPages > 1 && (
				<BlockPatternsPaging
					currentPage={ currentPage }
					numPages={ numPages }
					changePage={ changePage }
					totalItems={ totalItems }
				/>
			) }
		</div>
	);
}

function BlockPatternsTabs( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const [ patternFilter, setPatternFilter ] = useState( 'all' );
	const categories = usePatternsCategories( rootClientId, patternFilter );
	const initialCategory = selectedCategory || categories[ 0 ];
	const isMobile = useViewportMatch( 'medium', '<' );
	return (
		<>
			{ ! isMobile && (
				<div className="block-editor-inserter__block-patterns-tabs-container">
					<nav aria-label={ __( 'Block pattern categories' ) }>
						<ItemGroup
							role="list"
							className="block-editor-inserter__block-patterns-tabs"
						>
							<SelectControl
								__nextHasNoMarginBottom
								label={ __( 'Filters' ) }
								options={ SYNC_FILTERS }
								value={ patternFilter }
								onChange={ ( value ) => {
									setPatternFilter( value );
									onSelectCategory( selectedCategory, value );
								} }
							/>
							{ categories.map( ( category ) => (
								<Item
									role="listitem"
									key={ category.name }
									onClick={ () =>
										onSelectCategory(
											category,
											patternFilter
										)
									}
									className={
										category === selectedCategory
											? 'block-editor-inserter__patterns-category block-editor-inserter__patterns-selected-category'
											: 'block-editor-inserter__patterns-category'
									}
									aria-label={ category.label }
									aria-current={
										category === selectedCategory
											? 'true'
											: undefined
									}
								>
									<HStack>
										<FlexBlock>
											{ category.label }
										</FlexBlock>
										<Icon
											icon={
												isRTL()
													? chevronLeft
													: chevronRight
											}
										/>
									</HStack>
								</Item>
							) ) }
							<div role="listitem">
								<Button
									className="block-editor-inserter__patterns-explore-button"
									onClick={ () =>
										setShowPatternsExplorer( true )
									}
									variant="secondary"
								>
									{ __( 'Explore all patterns' ) }
								</Button>
							</div>
						</ItemGroup>
					</nav>
				</div>
			) }
			{ isMobile && (
				<MobileTabNavigation categories={ categories }>
					{ ( category ) => (
						<BlockPatternsCategoryPanel
							onInsert={ onInsert }
							rootClientId={ rootClientId }
							category={ category }
							showTitlesAsTooltip={ false }
						/>
					) }
				</MobileTabNavigation>
			) }
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ initialCategory }
					patternCategories={ categories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				/>
			) }
		</>
	);
}

export default BlockPatternsTabs;
