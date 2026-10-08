import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { Icon } from '../icon';
import type { PrefixIconProps } from './types';
import styles from './style.module.css';

/**
 * Renders an icon before a menu item label. Keep the default 16px size for
 * consistency. Use familiar icons to help users recognize actions or give
 * a key action useful prominence.
 *
 * Prefer icons on every item in a group, or none. If only one item needs an
 * icon, reconsider its grouping. Prefer omitting it over adding unnecessary
 * icons to the other items. Mixed icon usage is supported.
 *
 * Make the action clear in its label. Avoid combining a prefix icon and a
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
