import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuPositionerProps } from './types';
import styles from './styles.module.css';

const Positioner = forwardRef< HTMLDivElement, MenuPositionerProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Positioner
			ref={ ref }
			className={ clsx( styles.positioner, className ) }
			{ ...props }
		/>
	)
);
Positioner.displayName = 'Menu.Positioner';

export { Positioner };
