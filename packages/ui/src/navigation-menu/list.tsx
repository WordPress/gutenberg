import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import { useNavigationMenuContext } from './context';
import styles from './style.module.css';
import type { ListProps } from './types';

/**
 * Contains a semantic list of navigation items.
 */
const List = forwardRef< HTMLUListElement, ListProps >(
	function NavigationMenuList( { className, ...props }, ref ) {
		const { orientation } = useNavigationMenuContext();

		return (
			<_NavigationMenu.List
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.list,
					styles[ `list--${ orientation }` ],
					orientation === 'vertical' &&
						itemLayoutStyles[ 'alignment-group' ],
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { List };
