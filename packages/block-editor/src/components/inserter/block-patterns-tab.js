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
import { useAsyncList, useViewportMatch } from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
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

const noop = () => {};

// Preferred order of pattern categories. Any other categories should
// be at the bottom without any re-ordering.
const patternCategoriesOrder = [
	'custom',
	'featured',
	'posts',
	'text',
	'gallery',
	'call-to-action',
	'banner',
	'header',
	'footer',
];

function usePatternsCategories( rootClientId ) {
	const [ allPatterns, allCategories ] = usePatternsState(
		undefined,
		rootClientId
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
				allPatterns.some( ( pattern ) =>
					pattern.categories?.includes( category.name )
				)
			)
			.sort( ( { name: aName }, { name: bName } ) => {
				// Sort categories according to `patternCategoriesOrder`.
				let aIndex = patternCategoriesOrder.indexOf( aName );
				let bIndex = patternCategoriesOrder.indexOf( bName );
				// All other categories should come after that.
				if ( aIndex < 0 ) aIndex = patternCategoriesOrder.length;
				if ( bIndex < 0 ) bIndex = patternCategoriesOrder.length;
				return aIndex - bIndex;
			} );

		if (
			allPatterns.some(
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

		return categories;
	}, [ allCategories, allPatterns, hasRegisteredCategory ] );

	return populatedCategories;
}

export function BlockPatternsCategoryDialog( {
	rootClientId,
	onInsert,
	onHover,
	category,
	showTitlesAsTooltip,
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
	const [ allPatterns, , onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

	const availableCategories = usePatternsCategories( rootClientId );
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) => {
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
		[ allPatterns, availableCategories, category.name ]
	);

	const categoryPatternsList = useAsyncList( currentCategoryPatterns );

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
				shownPatterns={ categoryPatternsList }
				blockPatterns={ currentCategoryPatterns }
				onClickPattern={ onClick }
				onHover={ onHover }
				label={ category.label }
				orientation="vertical"
				category={ category.label }
				isDraggable
				showTitlesAsTooltip={ showTitlesAsTooltip }
			/>
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
					<nav aria-label={ __( 'Block pattern categories' ) }>
						<ItemGroup
							role="list"
							className="block-editor-inserter__block-patterns-tabs"
						>
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
