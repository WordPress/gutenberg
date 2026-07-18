import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { ItemChevron } from '../utils/item-layout';
import { useNavigationMenuContext } from './context';
import styles from './style.module.css';
import type { IconProps } from './types';

/**
 * Renders a decorative directional indicator for a navigation flyout.
 */
const Icon = forwardRef< HTMLSpanElement, IconProps >(
	function NavigationMenuIcon( { children, className, ...props }, ref ) {
		const { orientation } = useNavigationMenuContext();

		return (
			<_NavigationMenu.Icon
				ref={ ref }
				className={ clsx( styles.icon, className ) }
				aria-hidden="true"
				{ ...props }
			>
				{ children ?? (
					<ItemChevron
						direction={
							orientation === 'horizontal'
								? 'block-end'
								: 'inline-end'
						}
					/>
				) }
			</_NavigationMenu.Icon>
		);
	}
);

export { Icon };
