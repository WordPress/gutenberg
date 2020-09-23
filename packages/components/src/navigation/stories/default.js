/**
 * WordPress dependencies
 */
import { Icon, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

export function DefaultStory() {
	return (
		<Navigation activeItem="item-1" className="navigation-story">
			<NavigationMenu title="Home">
				<NavigationGroup title="Menu Group">
					<NavigationItem item="item-1" title="Item 1" />
					<NavigationItem item="item-2" title="Item 2" />
					<NavigationItem
						badge="5"
						item="item-sub-menu"
						navigateToMenu="sub-menu"
						title="Sub-Menu"
					/>
					<NavigationItem item="item-3" title="Item 3" />
				</NavigationGroup>
				<NavigationGroup title="External Links">
					<NavigationItem
						href="https://wordpress.org/"
						item="item-4"
						target="_blank"
						title="WordPress.org"
					/>
					<NavigationItem item="item-5">
						<a
							className="navigation-story__wordpress-icon"
							href="https://wordpress.org/"
							target="_blank"
							rel="noreferrer"
						>
							<Icon icon={ wordpress } />
						</a>
					</NavigationItem>
				</NavigationGroup>
			</NavigationMenu>

			<NavigationMenu menu="sub-menu" parentMenu="root" title="Sub-Menu">
				<NavigationItem item="child-1" title="Child 1" />
				<NavigationItem item="child-2" title="Child 2" />
				<NavigationItem
					badge="2"
					item="child-nested-sub-menu"
					navigateToMenu="nested-sub-menu"
					title="Nested Sub-Menu"
				/>
			</NavigationMenu>

			<NavigationMenu
				menu="nested-sub-menu"
				parentMenu="sub-menu"
				title="Nested Sub-Menu"
			>
				<NavigationItem item="sub-child-1" title="Sub-Child 1" />
				<NavigationItem item="sub-child-2" title="Sub-Child 2" />
			</NavigationMenu>
		</Navigation>
	);
}
