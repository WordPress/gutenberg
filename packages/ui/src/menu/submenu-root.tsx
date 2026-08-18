import { Menu as _Menu } from '@base-ui/react/menu';
import { MenuContext } from './context';
import type { SubmenuRootProps } from './types';

/**
 * Groups all parts of a nested submenu.
 */
function SubmenuRoot( {
	highlightItemOnHover = false,
	...props
}: SubmenuRootProps ) {
	return (
		<MenuContext.Provider value={ { isSubmenu: true } }>
			<_Menu.SubmenuRoot
				{ ...props }
				highlightItemOnHover={ highlightItemOnHover }
			/>
		</MenuContext.Provider>
	);
}

export { SubmenuRoot };
