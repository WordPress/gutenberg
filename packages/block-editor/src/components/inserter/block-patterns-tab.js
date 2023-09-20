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
import { _x, __, _n, isRTL, sprintf } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';
import { focus } from '@wordpress/dom';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';
import PatternsExplorerModal from './block-patterns-explorer/explorer';
import MobileTabNavigation from './mobile-tab-navigation';
import BlockPatternsPaging from '../block-patterns-paging';
import usePatternsPaging from './hooks/use-patterns-paging';
import {
	PATTERN_TYPES,
	default as BlockPatternsSourceFilter,
} from './block-patterns-source-filter';
import {
	BlockPatternsSyncFilter,
	SYNC_TYPES,
} from './block-patterns-sync-filter';

const noop = () => {};

export const allPatternsCategory = {
	name: 'allPatterns',
	label: __( 'All categories' ),
};

export function isPatternFiltered( pattern, sourceFilter, syncFilter ) {
	if (
		sourceFilter === PATTERN_TYPES.theme &&
		pattern.name.startsWith( 'core/block' )
	) {
		return true;
	}
	if ( sourceFilter === PATTERN_TYPES.user && ! pattern.id ) {
		return true;
	}
	if (
		sourceFilter === PATTERN_TYPES.user &&
		syncFilter === SYNC_TYPES.full &&
		pattern.syncStatus !== ''
	) {
		return true;
	}
	if (
		sourceFilter === PATTERN_TYPES.user &&
		syncFilter === SYNC_TYPES.unsynced &&
		pattern.syncStatus !== 'unsynced'
	) {
		return true;
	}
	return false;
}

export function usePatternsCategories( rootClientId, sourceFilter = 'all' ) {
	const [ patterns, allCategories ] = usePatternsState(
		undefined,
		rootClientId
	);

	const filteredPatterns = useMemo(
		() =>
			sourceFilter === 'all'
				? patterns
				: patterns.filter(
						( pattern ) =>
							! isPatternFiltered( pattern, sourceFilter )
				  ),
		[ sourceFilter, patterns ]
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
		speak(
			sprintf(
				/* translators: %d: number of categories . */
				_n(
					'%d category button displayed.',
					'%d category buttons displayed.',
					categories.length
				),
				categories.length
			)
		);
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
	const [ allPatterns, , onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId
	);
	const [ patternSyncFilter, setPatternSyncFilter ] = useState( 'all' );

	const availableCategories = usePatternsCategories(
		rootClientId,
		patternFilter
	);
	const container = useRef();
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) => {
				if (
					isPatternFiltered(
						pattern,
						patternFilter,
						patternSyncFilter
					)
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
		[
			allPatterns,
			availableCategories,
			category.name,
			patternFilter,
			patternSyncFilter,
		]
	);

	const pagingProps = usePatternsPaging(
		currentCategoryPatterns,
		category,
		container
	);

	// Hide block pattern preview on unmount.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( () => () => onHover( null ), [] );

	return (
		<div
			className="block-editor-inserter__patterns-category-panel"
			ref={ container }
		>
			<div className="block-editor-inserter__patterns-category-panel-title">
				{ category.label }
			</div>
			<p>{ category.description }</p>
			{ patternFilter === PATTERN_TYPES.user && (
				<BlockPatternsSyncFilter
					patternSyncFilter={ patternSyncFilter }
					setPatternSyncFilter={ setPatternSyncFilter }
				/>
			) }
			{ ! currentCategoryPatterns.length && (
				<div>{ __( 'No results found' ) }</div>
			) }
			{ currentCategoryPatterns.length > 0 && (
				<BlockPatternList
					shownPatterns={ pagingProps.categoryPatternsAsyncList }
					blockPatterns={ pagingProps.categoryPatterns }
					onClickPattern={ onClickPattern }
					onHover={ onHover }
					label={ category.label }
					orientation="vertical"
					category={ category.name }
					isDraggable
					showTitlesAsTooltip={ showTitlesAsTooltip }
					patternFilter={ patternFilter }
				/>
			) }
			{ pagingProps.numPages > 1 && (
				<BlockPatternsPaging { ...pagingProps } />
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
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );

	const categories = usePatternsCategories(
		rootClientId,
		patternSourceFilter
	);

	const initialCategory = selectedCategory || categories[ 0 ];
	const isMobile = useViewportMatch( 'medium', '<' );
	return (
		<>
			{ ! isMobile && (
				<div className="block-editor-inserter__block-patterns-tabs-container">
					<nav
						aria-label={ __( 'Block pattern categories' ) }
						className="block-editor-inserter__block-patterns-tabs"
					>
						<BlockPatternsSourceFilter
							value={ patternSourceFilter }
							onChange={ ( value ) => {
								setPatternSourceFilter( value );
								onSelectCategory( allPatternsCategory, value );
							} }
						/>
						<ItemGroup role="list">
							{ categories.map( ( category ) => (
								<Item
									role="listitem"
									key={ category.name }
									onClick={ () =>
										onSelectCategory(
											category,
											patternSourceFilter
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
					rootClientId={ rootClientId }
				/>
			) }
		</>
	);
}

export default BlockPatternsTabs;
