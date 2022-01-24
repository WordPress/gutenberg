/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Icon, wordpress, home } from '@wordpress/icons';

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
	const [ backButtonBadge, setBackButtonBadge ] = useState( 1 );
	const [ backButtonPreventedBadge, setBackButtonPreventedBadge ] = useState(
		1
	);

	return (
		<Navigation activeItem={ activeItem } className="navigation-story">
			<NavigationMenu title="Home">
				<NavigationGroup title="Items without Active State">
					<NavigationItem item="item-1" title="Item 1" />
					<NavigationItem item="item-2" title="Item 2" />
				</NavigationGroup>
				<NavigationGroup title="Items with Unusual Features">
					<NavigationItem
						icon={ home }
						item="item-sub-menu"
						navigateToMenu="sub-menu"
						title="Sub-Menu with Custom Back Label"
					/>
					<NavigationItem
						item="item-custom-back-click-handler"
						navigateToMenu="custom-back-click-handler-menu"
						title="Custom Back Click Handler"
						badge={ backButtonBadge }
					/>
					<NavigationItem
						item="item-custom-back-click-handler-prevented"
						navigateToMenu="custom-back-click-handler-prevented-menu"
						title="Prevent back navigation"
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
				<NavigationGroup title="Text only items">
					<NavigationItem
						item="item-text-only"
						title="This is just text, doesn't have any functionality"
						isText
					/>
					<NavigationItem
						item="item-text-only-with-badge"
						title="Text with badge"
						badge="2"
						isText
					/>
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

			<NavigationMenu
				menu="custom-back-click-handler-menu"
				title="Custom back button click handler"
				parentMenu="root"
				onBackButtonClick={ () =>
					setBackButtonBadge( backButtonBadge + 1 )
				}
				backButtonLabel="Increment badge and go back"
			/>

			<NavigationMenu
				menu="custom-back-click-handler-prevented-menu"
				title="Custom back button click handler prevented"
				parentMenu="root"
				onBackButtonClick={ ( event ) => {
					event.preventDefault();
					setBackButtonPreventedBadge( backButtonPreventedBadge + 1 );
				} }
				backButtonLabel="Increment badge"
			>
				<NavigationItem
					item="custom-back-click-prevented-child-1"
					title="You can't go back from here"
					badge={ backButtonPreventedBadge }
				/>
			</NavigationMenu>
		</Navigation>
	);
}
