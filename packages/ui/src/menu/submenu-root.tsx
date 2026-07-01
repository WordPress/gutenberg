import { Menu as _Menu } from '@base-ui/react/menu';
import { MenuContext } from './context';
import type { SubmenuRootProps } from './types';

/**
 * Groups all parts of a nested submenu.
 */
function SubmenuRoot( props: SubmenuRootProps ) {
	return (
		<MenuContext.Provider value={ { isSubmenu: true } }>
			<_Menu.SubmenuRoot { ...props } />
		</MenuContext.Provider>
	);
}

export { SubmenuRoot };
