import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { SeparatorProps } from './types';

/**
 * Renders a visual and semantic separator between menu items.
 */
const Separator = forwardRef< HTMLDivElement, SeparatorProps >(
	function MenuSeparator( { className, ...props }, ref ) {
		return (
			<_Menu.Separator
				ref={ ref }
				className={ clsx( styles.separator, className ) }
				{ ...props }
			/>
		);
	}
);

export { Separator };
