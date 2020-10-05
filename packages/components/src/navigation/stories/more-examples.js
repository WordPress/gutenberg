/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Icon, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationGroup from '../group';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

export function MoreExamplesStory() {
	const [ activeItem, setActiveItem ] = useState( 'child-1' );
	const [ delayedBadge, setDelayedBadge ] = useState();
	useEffect( () => {
		const timeout = setTimeout( () => setDelayedBadge( 2 ), 1500 );
		return () => clearTimeout( timeout );
	} );

	return (
		<Navigation activeItem={ activeItem } className="navigation-story">
			<NavigationMenu title="Home">
				<NavigationGroup title="Items without Active State">
					<NavigationItem item="item-1" title="Item 1" />
					<NavigationItem item="item-2" title="Item 2" />
				</NavigationGroup>
				<NavigationGroup title="Items with Unusual Features">
					<NavigationItem
						item="item-sub-menu"
						navigateToMenu="sub-menu"
						title="Sub-Menu with Custom Back Label"
					/>
					<NavigationItem
						item="item-nonexistent-menu"
						navigateToMenu="nonexistent-menu"
						title="Navigate to Nonexistent Menu"
					/>
					<NavigationItem
						badge={ delayedBadge }
						item="item-delayed-badge"
						onClick={ () => setActiveItem( 'item-delayed-badge' ) }
						title="Item with a Delayed Badge"
					/>
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
							<em>Custom Content</em>
						</a>
					</NavigationItem>
				</NavigationGroup>
			</NavigationMenu>

			<NavigationMenu
				backButtonLabel="Custom Back Button Label"
				menu="sub-menu"
				parentMenu="root"
				title="Sub-Menu with Custom Back Label"
			>
				<NavigationItem
					item="child-1"
					onClick={ () => setActiveItem( 'child-1' ) }
					title="Child 1"
				/>
				<NavigationItem
					item="child-2"
					onClick={ () => setActiveItem( 'child-2' ) }
					title="Child 2"
				/>
			</NavigationMenu>
		</Navigation>
	);
}
