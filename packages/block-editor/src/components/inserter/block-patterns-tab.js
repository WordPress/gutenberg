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
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
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

function usePatternsCategories() {
	const [ allPatterns, allCategories ] = usePatternsState();

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
			.sort( ( { name: currentName }, { name: nextName } ) => {
				if ( ! [ currentName, nextName ].includes( 'featured' ) ) {
					return 0;
				}
				return currentName === 'featured' ? -1 : 1;
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
	}, [ allPatterns, allCategories ] );

	return populatedCategories;
}

export function BlockPatternsCategoryDialog( {
	rootClientId,
	onInsert,
	category,
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
			className="block-editor-inserter__patterns-category-panel"
		>
			<BlockPatternsCategoryPanel
				rootClientId={ rootClientId }
				onInsert={ onInsert }
				category={ category }
			/>
		</div>
	);
}

export function BlockPatternsCategoryPanel( {
	rootClientId,
	onInsert,
	category,
} ) {
	const [ allPatterns, , onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

	const availableCategories = usePatternsCategories();
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
		[ allPatterns, category ]
	);

	const currentShownPatterns = useAsyncList( currentCategoryPatterns );

	if ( ! currentCategoryPatterns.length ) {
		return null;
	}

	return (
		<div>
			<div className="block-editor-inserter__patterns-category-panel-title">
				{ category.label }
			</div>
			<p>{ category.description }</p>
			<BlockPatternList
				shownPatterns={ currentShownPatterns }
				blockPatterns={ currentCategoryPatterns }
				onClickPattern={ onClick }
				label={ category.label }
				orientation="vertical"
				category={ category.label }
				isDraggable
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
	const categories = usePatternsCategories();
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
										<Icon icon={ chevronRight } />
									</HStack>
								</Item>
							) ) }

							<div
								role="presentation"
								className="block-editor-inserter__patterns-fill-space"
							/>

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
				<BlockPatternsTabNavigation
					onInsert={ onInsert }
					rootClientId={ rootClientId }
				/>
			) }
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ selectedCategory }
					patternCategories={ categories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				/>
			) }
		</>
	);
}

function BlockPatternsTabNavigation( { onInsert, rootClientId } ) {
	const categories = usePatternsCategories();

	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<ItemGroup>
					{ categories.map( ( category ) => (
						<NavigatorButton
							key={ category.name }
							path={ `/category/${ category.name }` }
							as={ Item }
							isAction
						>
							<HStack>
								<FlexBlock>{ category.label }</FlexBlock>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigatorButton>
					) ) }
				</ItemGroup>
			</NavigatorScreen>

			{ categories.map( ( category ) => (
				<NavigatorScreen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					<NavigatorBackButton
						icon={ isRTL() ? chevronRight : chevronLeft }
						isSmall
						aria-label={ __( 'Navigate to the categories list' ) }
					>
						{ __( 'Back' ) }
					</NavigatorBackButton>
					<BlockPatternsCategoryPanel
						category={ category }
						rootClientId={ rootClientId }
						onInsert={ onInsert }
					/>
				</NavigatorScreen>
			) ) }
		</NavigatorProvider>
	);
}

export default BlockPatternsTabs;
