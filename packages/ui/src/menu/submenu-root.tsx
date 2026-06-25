import { Menu as _Menu } from '@base-ui/react/menu';
import type { SubmenuRootProps } from './types';

/**
 * Groups all parts of a nested submenu.
 */
function SubmenuRoot( props: SubmenuRootProps ) {
	return <_Menu.SubmenuRoot { ...props } />;
}

export { SubmenuRoot };
