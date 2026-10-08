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
 * Use familiar icons to help users recognize actions or give a key action
 * useful prominence. Prefer icons on every item in a group, or none. If only
 * one item benefits from an icon, reconsider its grouping. Prefer omitting
 * the icon over adding unnecessary icons to the other items. Mixed icon usage
 * is supported; labels without a prefix start at the icon column, without an
 * empty icon space. Different groups can make different choices. Avoid
 * combining a prefix icon and a description in the same item. The default
 * icon size is 16px.
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
