import { Menu as _Menu } from '@base-ui/react/menu';
import type { RootProps } from './types';

/**
 * Groups all parts of a menu.
 *
 * `Menu.Root` manages the open state and provides context for menu triggers,
 * popups, and items. Compose it with `Menu.Trigger` and `Menu.Popup` to build
 * a menu button, and with `Menu.SubmenuRoot` / `Menu.SubmenuTrigger` to build
 * nested menus.
 */
function Root< Payload = unknown >( props: RootProps< Payload > ) {
	return <_Menu.Root< Payload > { ...props } />;
}

export { Root };
