/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	FlexBlock,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

function CategoryTabs( {
	categories,
	selectedCategory,
	onSelectCategory,
	children,
} ) {
	return (
		<Tabs
			className="block-editor-inserter__category-tabs"
			selectOnMove={ false }
			selectedTabId={ selectedCategory ? selectedCategory.name : null }
			orientation="vertical"
			onSelect={ ( categoryId ) => {
				// Pass the full category object
				onSelectCategory(
					categories.find(
						( category ) => category.name === categoryId
					)
				);
			} }
		>
			<Tabs.TabList className="block-editor-inserter__category-tablist">
				{ categories.map( ( category ) => (
					<Tabs.Tab
						key={ category.name }
						tabId={ category.name }
						className="block-editor-inserter__category-tab"
						aria-label={ category.label }
						aria-current={
							category === selectedCategory ? 'true' : undefined
						}
					>
						<HStack>
							<FlexBlock>{ category.label }</FlexBlock>
							<Icon
								icon={ isRTL() ? chevronLeft : chevronRight }
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
					className="block-editor-inserter__category-panel"
				>
					{ children }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
}

export default CategoryTabs;
