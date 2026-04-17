import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuGroupProps } from './types';
import styles from './styles.module.css';

const Group = forwardRef< HTMLDivElement, MenuGroupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Group
			ref={ ref }
			className={ clsx( styles.group, className ) }
			{ ...props }
		/>
	)
);
Group.displayName = 'Menu.Group';

export { Group };
