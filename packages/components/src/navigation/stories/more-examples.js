/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Navigation from '..';
import NavigationItem from '../item';
import NavigationMenu from '../menu';

export function MoreExamplesStory() {
	const [ delayedBadge, setDelayedBadge ] = useState();
	useEffect( () => {
		const timeout = setTimeout( () => setDelayedBadge( 2 ), 1500 );
		return () => clearTimeout( timeout );
	} );

	return (
		<Navigation className="navigation-story">
			<NavigationMenu title="Home">
				<NavigationItem item="item-1" title="Item 1" />
				<NavigationItem item="item-2" title="Item 2" />
				<NavigationItem
					item="item-nonexistent-menu"
					navigateToMenu="nonexistent-menu"
					title="Navigate to Nonexistent Menu"
				/>
				<NavigationItem
					badge={ delayedBadge }
					item="item-delayed-badge"
					title="Item with a Delayed Badge"
				/>
			</NavigationMenu>
		</Navigation>
	);
}
