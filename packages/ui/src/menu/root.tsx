import { Menu as _Menu } from '@base-ui/react/menu';
import { MenuContext } from './context';
import type { RootProps } from './types';

/**
 * Groups all parts of a menu.
 *
 * `Menu.Root` manages the open state and provides context for menu triggers,
 * popups, and items. Compose it with `Menu.Trigger` and `Menu.Popup` to build
 * a menu button, and with `Menu.SubmenuRoot` / `Menu.SubmenuTrigger` to build
 * nested menus.
 *
 * ```jsx
 * <Menu.Root>
 *   <Menu.Trigger>Open menu</Menu.Trigger>
 *   <Menu.Popup>
 *     <Menu.Item>Action</Menu.Item>
 *   </Menu.Popup>
 * </Menu.Root>
 * ```
 */
function Root< Payload = unknown >( props: RootProps< Payload > ) {
	return (
		<MenuContext.Provider value={ { isSubmenu: false } }>
			<_Menu.Root< Payload > { ...props } />
		</MenuContext.Provider>
	);
}

export { Root };
