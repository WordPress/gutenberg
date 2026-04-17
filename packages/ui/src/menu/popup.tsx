import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuPopupProps } from './types';
import styles from './styles.module.css';

const Popup = forwardRef< HTMLDivElement, MenuPopupProps >(
	( { className, ...props }, ref ) => (
		<BaseMenu.Popup
			ref={ ref }
			className={ clsx( styles.popup, className ) }
			{ ...props }
		/>
	)
);
Popup.displayName = 'Menu.Popup';

export { Popup };
