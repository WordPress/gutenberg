/**
 * WordPress dependencies
 */
import { usePrevious, useReducedMotion } from '@wordpress/compose';
import {
	privateApis as componentsPrivateApis,
	__unstableMotion as motion,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

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

	const previousSelectedCategory = usePrevious( selectedCategory );

	const selectedTabId = selectedCategory ? selectedCategory.name : null;
	const [ activeTabId, setActiveId ] = useState();
	const firstTabId = categories?.[ 0 ]?.name;

	// If there is no active tab, make the first tab the active tab, so that
	// when focus is moved to the tablist, the first tab will be focused
	// despite not being selected
	if ( selectedTabId === null && ! activeTabId && firstTabId ) {
		setActiveId( firstTabId );
	}

	return (
		<Tabs
			selectOnMove={ false }
			selectedTabId={ selectedTabId }
			orientation="vertical"
			onSelect={ ( categoryId ) => {
				// Pass the full category object
				onSelectCategory(
					categories.find(
						( category ) => category.name === categoryId
					)
				);
			} }
			activeTabId={ activeTabId }
			onActiveTabIdChange={ setActiveId }
		>
			<Tabs.TabList className="block-editor-inserter__category-tablist">
				{ categories.map( ( category ) => (
					<Tabs.Tab
						key={ category.name }
						tabId={ category.name }
						aria-current={
							category === selectedCategory ? 'true' : undefined
						}
					>
						{ category.label }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ categories.map( ( category ) => (
				<Tabs.TabPanel
					key={ category.name }
					tabId={ category.name }
					focusable={ false }
				>
					<motion.div
						className="block-editor-inserter__category-panel"
						initial={
							! previousSelectedCategory ? 'closed' : 'open'
						}
						animate="open"
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
						{ children }
					</motion.div>
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
}

export default CategoryTabs;
