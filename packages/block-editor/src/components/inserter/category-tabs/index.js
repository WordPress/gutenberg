/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	FlexBlock,
	privateApis as componentsPrivateApis,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
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
	// Copied from InterfaceSkeleton.
	const ANIMATION_DURATION = 0.25;
	const disableMotion = useReducedMotion();
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : ANIMATION_DURATION,
		ease: [ 0.6, 0, 0.4, 1 ],
	};
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
			<AnimatePresence initial={ false }>
				{ selectedCategory && (
					<motion.div
						className="block-editor-inserter__category-panel"
						initial="closed"
						animate="open"
						exit="closed"
						variants={ {
							open: {
								transform: 'translateX( 0 )',
								transitionEnd: {
									zIndex: '1',
								},
							},
							closed: {
								transform: 'translateX( -100% )',
								zIndex: '-1',
							},
						} }
						transition={ defaultTransition }
					>
						{ categories.map( ( category ) => (
							<Tabs.TabPanel
								key={ category.name }
								tabId={ category.name }
								focusable={ false }
							>
								{ children }
							</Tabs.TabPanel>
						) ) }
					</motion.div>
				) }
			</AnimatePresence>
		</Tabs>
	);
}

export default CategoryTabs;
