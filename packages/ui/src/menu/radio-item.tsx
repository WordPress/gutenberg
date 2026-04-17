import { Menu as BaseMenu } from '@base-ui/react/menu';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { ItemContent } from './item-content';
import { RadioItemIndicator } from './radio-item-indicator';
import type { MenuRadioItemProps } from './types';
import styles from './styles.module.css';

const RadioItem = forwardRef< HTMLDivElement, MenuRadioItemProps >(
	( { className, children, suffix, ...props }, ref ) => (
		<BaseMenu.RadioItem
			ref={ ref }
			className={ clsx( styles.item, className ) }
			{ ...props }
		>
			<RadioItemIndicator />
			<ItemContent suffix={ suffix }>{ children }</ItemContent>
		</BaseMenu.RadioItem>
	)
);
RadioItem.displayName = 'Menu.RadioItem';

export { RadioItem };
