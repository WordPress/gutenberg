import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { MenuRootProps } from './types';

function Root( props: MenuRootProps ) {
	return <BaseMenu.Root { ...props } />;
}

export { Root };
