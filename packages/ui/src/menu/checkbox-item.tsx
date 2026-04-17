import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { CheckboxItemIndicator } from './checkbox-item-indicator';
import { ItemContent } from './item-content';
import type { MenuCheckboxItemProps } from './types';
import styles from './styles.module.css';

const CheckboxItem = forwardRef< HTMLDivElement, MenuCheckboxItemProps >(
	( { className, children, suffix, ...props }, ref ) => (
		<BaseMenu.CheckboxItem
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<CheckboxItemIndicator />
			<ItemContent suffix={ suffix }>{ children }</ItemContent>
		</BaseMenu.CheckboxItem>
	)
);
CheckboxItem.displayName = 'Menu.CheckboxItem';

export { CheckboxItem };
