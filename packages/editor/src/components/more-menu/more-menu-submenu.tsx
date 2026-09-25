import { Children, isValidElement } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps, ReactNode } from 'react';
import MoreMenuItem from './more-menu-item';

type MoreMenuSubmenuProps = {
	/**
	 * Label of the item that opens the submenu.
	 */
	label: string;

	/**
	 * Items of the submenu.
	 */
	children: ReactNode;
};

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
export function toMenuItems( fills: ReactNode ) {
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

/**
 * Renders a submenu of the editor's Options menu, opened from an item that
 * carries a label.
 */
export default function MoreMenuSubmenu( {
	label,
	children,
}: MoreMenuSubmenuProps ) {
	return (
		<Menu.SubmenuRoot>
			<Menu.SubmenuTrigger>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<Menu.Popup>{ children }</Menu.Popup>
		</Menu.SubmenuRoot>
	);
}
