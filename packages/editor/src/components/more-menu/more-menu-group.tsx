import { Children, isValidElement } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps, ReactNode } from 'react';
import MoreMenuItem from './more-menu-item';

type MoreMenuGroupProps = {
	/**
	 * Label of the group.
	 */
	label: string;

	/**
	 * Fills of the slot.
	 */
	children: ReactNode;
};

/**
 * Renders the fills of an action item slot as a group of the more menu.
 */
export default function MoreMenuGroup( {
	label,
	children,
}: MoreMenuGroupProps ) {
	return (
		<>
			<Menu.Separator />
			<Menu.Group>
				<Menu.GroupLabel>{ label }</Menu.GroupLabel>
				{ toMenuItems( children ) }
			</Menu.Group>
		</>
	);
}

/**
 * Renders the fills that bring a menu item of their own as menu items.
 *
 * A fill takes the component to render from the slot, unless it passes an `as`
 * prop. The menu knows nothing about such an item, so keyboard navigation
 * would skip it. The `render` prop makes it part of the menu, while the fill
 * keeps rendering its own markup.
 *
 * @param fills Fills of the slot.
 *
 * @return The fills as menu items.
 */
function toMenuItems( fills: ReactNode ) {
	return Children.map( fills, ( fill ) => {
		if (
			! isValidElement< { href?: string } >( fill ) ||
			fill.type === MoreMenuItem
		) {
			return fill;
		}

		// The fill renders the content of the item, so the label element it
		// requires is never rendered and `aria-labelledby` points at nothing.
		// Naming falls back to the content of the fill.
		const label = <Menu.ItemLabel>{ null }</Menu.ItemLabel>;
		const render = fill as ComponentProps< typeof Menu.Item >[ 'render' ];

		return fill.props.href !== undefined ? (
			<Menu.LinkItem aria-labelledby="" render={ render }>
				{ label }
			</Menu.LinkItem>
		) : (
			<Menu.Item nativeButton aria-labelledby="" render={ render }>
				{ label }
			</Menu.Item>
		);
	} );
}
