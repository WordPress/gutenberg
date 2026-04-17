import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuTriggerProps } from './types';
import styles from './styles.module.css';

const Trigger = forwardRef< HTMLButtonElement, MenuTriggerProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Trigger
			ref={ ref }
			className={ clsx( styles.trigger, className ) }
			{ ...props }
		/>
	)
);
Trigger.displayName = 'Menu.Trigger';

export { Trigger };
