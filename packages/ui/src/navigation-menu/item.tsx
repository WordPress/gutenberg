import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { ItemValidationProvider } from './context';
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
		return (
			<ItemValidationProvider value={ value }>
				<_NavigationMenu.Item
					ref={ ref }
					className={ clsx( styles.item, className ) }
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
