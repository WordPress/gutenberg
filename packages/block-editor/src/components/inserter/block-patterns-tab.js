/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import { _x, __ } from '@wordpress/i18n';
import { useAsyncList, useViewportMatch } from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexBlock,
	Card,
	CardBody,
	Button,
} from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';
import PatternsExplorerModal from './block-patterns-explorer/explorer';

export function BlockPatternsCategoryPanel( {
	rootClientId,
	onInsert,
	category,
	onUnset,
} ) {
	const isMobile = useViewportMatch( 'medium', '<' );

	const [ allPatterns, , onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) =>
				category.name === 'uncategorized'
					? ! pattern.categories?.length
					: pattern.categories?.includes( category.name )
			),
		[ allPatterns, category ]
	);

	const currentShownPatterns = useAsyncList( currentCategoryPatterns );

	if ( ! currentCategoryPatterns.length ) {
		return null;
	}

	return (
		<div className="block-editor-inserter__patterns-category-panel">
			{ isMobile && (
				<Button variant="secondary" onClick={ () => onUnset() }>
					{ __( 'Back' ) }
				</Button>
			) }
			<h3>{ category.label }</h3>
			<p>{ category.description }</p>
			<BlockPatternList
				shownPatterns={ currentShownPatterns }
				blockPatterns={ currentCategoryPatterns }
				onClickPattern={ onClick }
				label={ category.label }
				orientation="vertical"
				isDraggable
			/>
		</div>
	);
}

function BlockPatternsTabs( { onSelectCategory, selectedCategory } ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const [ allPatterns, allCategories ] = usePatternsState();
	const isMobile = useViewportMatch( 'medium', '<' );

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

	return (
		<>
			<Card isBorderless>
				<CardBody size="small">
					<ItemGroup>
						{ populatedCategories.map( ( category ) => (
							<Item
								key={ category.name }
								onClick={ () => onSelectCategory( category ) }
							>
								<HStack>
									<FlexBlock>{ category.label }</FlexBlock>
									<Icon icon={ chevronRight } />
								</HStack>
							</Item>
						) ) }
					</ItemGroup>

					{ ! isMobile && (
						<Button
							variant="link"
							onClick={ () => setShowPatternsExplorer( true ) }
							className="block-editor-inserter__patterns-explore-button"
						>
							{ __( 'Explore all patterns' ) }
						</Button>
					) }
				</CardBody>
			</Card>
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ selectedCategory }
					patternCategories={ populatedCategories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				/>
			) }
		</>
	);
}

export default BlockPatternsTabs;
