import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { GroupLabelProps } from './types';

/**
 * Renders an accessible label for a menu group.
 */
const GroupLabel = forwardRef< HTMLDivElement, GroupLabelProps >(
	function MenuGroupLabel( { className, ...props }, ref ) {
		return (
			<_Menu.GroupLabel
				ref={ ref }
				className={ clsx( styles[ 'group-label' ], className ) }
				{ ...props }
			/>
		);
	}
);

export { GroupLabel };
