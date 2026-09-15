// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import type { ComponentProps, ReactNode } from 'react';

type MoreMenuSubmenuProps = {
	/**
	 * Label of the item that opens the submenu.
	 */
	label: string;

	/**
	 * Icon shown before the label.
	 */
	icon: ComponentProps< typeof Menu.PrefixIcon >[ 'icon' ];

	/**
	 * Items of the submenu.
	 */
	children: ReactNode;
};

/**
 * Renders a submenu of the editor's Options menu, opened from an item that
 * carries an icon and a label.
 */
export default function MoreMenuSubmenu( {
	label,
	icon,
	children,
}: MoreMenuSubmenuProps ) {
	return (
		<Menu.SubmenuRoot>
			<Menu.SubmenuTrigger prefix={ <Menu.PrefixIcon icon={ icon } /> }>
				<Menu.ItemLabel>{ label }</Menu.ItemLabel>
			</Menu.SubmenuTrigger>
			<Menu.Popup>{ children }</Menu.Popup>
		</Menu.SubmenuRoot>
	);
}
