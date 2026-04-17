import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Text } from '../text';
import type { MenuItemHelpTextProps } from './types';
import styles from './styles.module.css';

const ItemHelpText = forwardRef< HTMLSpanElement, MenuItemHelpTextProps >(
	( { className, ...props }, ref ) => (
		<Text
			ref={ ref }
			variant="body-sm"
			className={ clsx( styles.itemHelpText, className ) }
			{ ...props }
		/>
	)
);
ItemHelpText.displayName = 'Menu.ItemHelpText';

export { ItemHelpText };
