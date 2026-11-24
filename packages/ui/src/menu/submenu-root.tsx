import { Menu as _Menu } from '@base-ui/react/menu';
import { useMemo, useRef } from '@wordpress/element';
import { MenuContext, MenuGroupContext } from './context';
import type { SubmenuRootProps } from './types';

/**
 * Groups all parts of a nested submenu.
 */
function SubmenuRoot( props: SubmenuRootProps ) {
	const submenuTriggerRef = useRef< HTMLDivElement >( null );
	const contextValue = useMemo(
		() => ( { isSubmenu: true, submenuTriggerRef } ),
		[ submenuTriggerRef ]
	);

	return (
		<MenuContext.Provider value={ contextValue }>
			<MenuGroupContext.Provider value={ null }>
				<_Menu.SubmenuRoot { ...props } />
			</MenuGroupContext.Provider>
		</MenuContext.Provider>
	);
}

export { SubmenuRoot };
