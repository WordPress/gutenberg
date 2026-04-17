import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Icon, check } from '@wordpress/icons';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import type { MenuCheckboxItemIndicatorProps } from './types';
import styles from './styles.module.css';

const CheckboxItemIndicator = forwardRef<
	HTMLSpanElement,
	MenuCheckboxItemIndicatorProps
>( ( { className, ...props }, ref ) => (
	<BaseMenu.CheckboxItemIndicator
		ref={ ref }
		className={ clsx( styles.prefix, styles.indicatorPrefix, className ) }
		keepMounted
		{ ...props }
	>
		<Icon icon={ check } size={ 24 } />
	</BaseMenu.CheckboxItemIndicator>
) );
CheckboxItemIndicator.displayName = 'Menu.CheckboxItemIndicator';

export { CheckboxItemIndicator };
