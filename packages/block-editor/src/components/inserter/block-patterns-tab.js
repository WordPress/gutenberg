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
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
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
import usePatternsPaging from './hooks/use-patterns-paging';
import {
	BlockPatternsSyncFilter,
	SYNC_TYPES,
	PATTERN_TYPES,
} from './block-patterns-filter';

const noop = () => {};

export const allPatternsCategory = {
	name: 'allPatterns',
	label: __( 'All patterns' ),
};

export const myPatternsCategory = {
	name: 'myPatterns',
	label: __( 'My patterns' ),
};

export function isPatternFiltered( pattern, sourceFilter, syncFilter ) {
	const isUserPattern = pattern.name.startsWith( 'core/block' );
	const isDirectoryPattern =
		pattern.source === 'core' ||
		pattern.source?.startsWith( 'pattern-directory' );

	// If theme source selected, filter out user created patterns and those from
	// the core patterns directory.
	if (
		sourceFilter === PATTERN_TYPES.theme &&
		( isUserPattern || isDirectoryPattern )
	) {
		return true;
	}

	// If the directory source is selected, filter out user created patterns
	// and those bundled with the theme.
	if (
		sourceFilter === PATTERN_TYPES.directory &&
		( isUserPattern || ! isDirectoryPattern )
	) {
		return true;
	}

	// If user source selected, filter out theme patterns. Any pattern without
	// an id wasn't created by a user.
	if ( sourceFilter === PATTERN_TYPES.user && ! pattern.id ) {
		return true;
	}

	// Filter by sync status.
	if ( syncFilter === SYNC_TYPES.full && pattern.syncStatus !== '' ) {
		return true;
	}

	if (
		syncFilter === SYNC_TYPES.unsynced &&
		pattern.syncStatus !== 'unsynced' &&
		isUserPattern
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
		if ( filteredPatterns.some( ( pattern ) => pattern.id ) ) {
			categories.unshift( myPatternsCategory );
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
				key={ category.name }
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
} ) {
	const [ allPatterns, , onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId
	);
	const [ patternSyncFilter, setPatternSyncFilter ] = useState( 'all' );
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );

	const availableCategories = usePatternsCategories(
		rootClientId,
		patternSourceFilter
	);
	const scrollContainerRef = useRef();
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) => {
				if (
					isPatternFiltered(
						pattern,
						patternSourceFilter,
						patternSyncFilter
					)
				) {
					return false;
				}

				if ( category.name === allPatternsCategory.name ) {
					return true;
				}
				if ( category.name === myPatternsCategory.name && pattern.id ) {
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
			patternSourceFilter,
			patternSyncFilter,
		]
	);

	const pagingProps = usePatternsPaging(
		currentCategoryPatterns,
		category,
		scrollContainerRef
	);
	const { changePage } = pagingProps;

	// Hide block pattern preview on unmount.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( () => () => onHover( null ), [] );

	const onSetPatternSyncFilter = useCallback(
		( value ) => {
			setPatternSyncFilter( value );
			changePage( 1 );
		},
		[ setPatternSyncFilter, changePage ]
	);
	const onSetPatternSourceFilter = useCallback(
		( value ) => {
			setPatternSourceFilter( value );
			changePage( 1 );
		},
		[ setPatternSourceFilter, changePage ]
	);

	return (
		<div className="block-editor-inserter__patterns-category-panel">
			<VStack
				spacing={ 2 }
				className="block-editor-inserter__patterns-category-panel-header"
			>
				<HStack>
					<FlexBlock>
						<Heading level={ 4 } as="div">
							{ category.label }
						</Heading>
					</FlexBlock>
					<BlockPatternsSyncFilter
						patternSyncFilter={ patternSyncFilter }
						patternSourceFilter={ patternSourceFilter }
						setPatternSyncFilter={ onSetPatternSyncFilter }
						setPatternSourceFilter={ onSetPatternSourceFilter }
						scrollContainerRef={ scrollContainerRef }
						category={ category }
					/>
				</HStack>
				{ ! currentCategoryPatterns.length && (
					<Text
						variant="muted"
						className="block-editor-inserter__patterns-category-no-results"
					>
						{ __( 'No results found' ) }
					</Text>
				) }
			</VStack>

			{ currentCategoryPatterns.length > 0 && (
				<BlockPatternList
					ref={ scrollContainerRef }
					shownPatterns={ pagingProps.categoryPatternsAsyncList }
					blockPatterns={ pagingProps.categoryPatterns }
					onClickPattern={ onClickPattern }
					onHover={ onHover }
					label={ category.label }
					orientation="vertical"
					category={ category.name }
					isDraggable
					showTitlesAsTooltip={ showTitlesAsTooltip }
					patternFilter={ patternSourceFilter }
					pagingProps={ pagingProps }
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

	const categories = usePatternsCategories( rootClientId );

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
						<ItemGroup role="list">
							{ categories.map( ( category ) => (
								<Item
									role="listitem"
									key={ category.name }
									onClick={ () =>
										onSelectCategory( category )
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
							key={ category.name }
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
