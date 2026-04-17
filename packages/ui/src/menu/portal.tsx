import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { MenuPortalProps } from './types';

function Portal( props: MenuPortalProps ) {
	return <BaseMenu.Portal { ...props } />;
}

export { Portal };
