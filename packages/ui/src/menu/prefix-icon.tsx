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
 * For the best visual results, use prefix icons on every item in a group, or
 * omit them from the whole group. Labels align even when an icon is missing,
 * leaving empty space before that label. Keep exceptions rare and prefer
 * icons on almost all items if needed. Different groups can have different
 * icon usage.
 */
export const PrefixIcon = forwardRef< SVGSVGElement, PrefixIconProps >(
	function MenuPrefixIcon( { className, size = 24, style, ...props }, ref ) {
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
