import { Menu as _Menu } from '@base-ui/react/menu';
import { MenuContext, MenuGroupContext } from './context';
import type { SubmenuRootProps } from './types';

/**
 * Groups all parts of a nested submenu.
 */
function SubmenuRoot( props: SubmenuRootProps ) {
	return (
		<MenuContext.Provider value={ { isSubmenu: true } }>
			<MenuGroupContext.Provider value={ null }>
				<_Menu.SubmenuRoot { ...props } />
			</MenuGroupContext.Provider>
		</MenuContext.Provider>
	);
}

export { SubmenuRoot };
