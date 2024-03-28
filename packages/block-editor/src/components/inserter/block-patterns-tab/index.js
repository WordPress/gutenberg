/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import PatternsExplorerModal from '../block-patterns-explorer';
import MobileTabNavigation from '../mobile-tab-navigation';
import { PatternCategoryPreviews } from './pattern-category-previews';
import { usePatternCategories } from './use-pattern-categories';
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function BlockPatternsTab( {
	onSelectCategory,
	selectedCategory,
	onInsert,
	rootClientId,
	children,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );

	const categories = usePatternCategories( rootClientId );

	const initialCategory = selectedCategory || categories[ 0 ];
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<>
			{ ! isMobile && (
				<div className="block-editor-inserter__block-patterns-tabs-container">
					<Tabs
						selectOnMove={ false }
						aria-label={ __( 'Block pattern categories' ) }
						className="block-editor-inserter__block-patterns-tabs"
						orientation={ 'vertical' }
						selectedTabId={ initialCategory.name }
						onSelect={ ( categoryId ) => {
							// Pass the full category object
							onSelectCategory(
								categories.find(
									( category ) => category.name === categoryId
								)
							);
						} }
					>
						<Tabs.TabList>
							{ categories.map( ( category ) => (
								<Tabs.Tab
									key={ category.name }
									tabId={ category.name }
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
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ categories.map( ( category ) => (
							<Tabs.TabPanel
								key={ category.name }
								tabId={ category.name }
								focusable={ false }
								className="block-editor-inserter__patterns-category-dialog"
							>
								{ children }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
					<Button
						className="block-editor-inserter__patterns-explore-button"
						onClick={ () => setShowPatternsExplorer( true ) }
						variant="secondary"
					>
						{ __( 'Explore all patterns' ) }
					</Button>
				</div>
			) }
			{ isMobile && (
				<MobileTabNavigation categories={ categories }>
					{ ( category ) => (
						<PatternCategoryPreviews
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

export default BlockPatternsTab;
