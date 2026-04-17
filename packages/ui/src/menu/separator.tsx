import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuSeparatorProps } from './types';
import styles from './styles.module.css';

const Separator = forwardRef< HTMLHRElement, MenuSeparatorProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Separator
			ref={ ref }
			className={ clsx( styles.separator, className ) }
			{ ...props }
		/>
	)
);
Separator.displayName = 'Menu.Separator';

export { Separator };
