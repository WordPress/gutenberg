import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { MenuSubmenuRootProps } from './types';

function SubmenuRoot( props: MenuSubmenuRootProps ) {
	return <BaseMenu.SubmenuRoot { ...props } />;
}
SubmenuRoot.displayName = 'Menu.SubmenuRoot';

export { SubmenuRoot };
