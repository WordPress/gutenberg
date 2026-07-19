import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import { ItemValidationProvider, useNavigationMenuContext } from './context';
import styles from './style.module.css';
import type { ItemProps } from './types';

/**
 * Renders a semantic list item containing a navigation Link or a paired
 * Trigger and Content.
 */
const Item = forwardRef< HTMLLIElement, ItemProps >(
	function NavigationMenuItem(
		{ children, className, value, ...props },
		ref
	) {
		const { orientation } = useNavigationMenuContext();

		return (
			<ItemValidationProvider value={ value }>
				<_NavigationMenu.Item
					ref={ ref }
					className={ clsx(
						orientation === 'vertical' &&
							itemLayoutStyles[ 'alignment-wrapper' ],
						styles.item,
						className
					) }
					value={ value }
					{ ...props }
				>
					{ children }
				</_NavigationMenu.Item>
			</ItemValidationProvider>
		);
	}
);

export { Item };
