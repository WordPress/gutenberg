import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { Icon } from '../icon';
import type { PrefixIconProps } from './types';
import styles from './style.module.css';

/**
 * Renders an icon in a menu item's prefix slot, centered on a label line at the
 * top of the content row. The prefix slot hides it from assistive technology.
 *
 * Use familiar icons when they help users recognize actions. Use icons on
 * every item in a group, or omit them from the whole group. Prefer omitting
 * an icon over adding unnecessary icons to the other items. Labels align even
 * when an icon is missing, leaving empty space before that label. Different
 * groups can have different icon usage. Avoid combining a prefix icon and a
 * description in the same item.
 */
export const PrefixIcon = forwardRef< SVGSVGElement, PrefixIconProps >(
	function MenuPrefixIcon( { className, size = 16, style, ...props }, ref ) {
		return (
			<Icon
				{ ...props }
				ref={ ref }
				size={ size }
				className={ clsx( styles[ 'prefix-icon' ], className ) }
				style={
					{
						...style,
						'--_wp-ui-menu-prefix-icon-size': `${ size }px`,
					} as CSSProperties
				}
			/>
		);
	}
);

PrefixIcon.displayName = 'Menu.PrefixIcon';
