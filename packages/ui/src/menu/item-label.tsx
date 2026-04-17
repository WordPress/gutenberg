import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Text } from '../text';
import type { MenuItemLabelProps } from './types';
import styles from './styles.module.css';

const ItemLabel = forwardRef< HTMLSpanElement, MenuItemLabelProps >(
	( { className, ...props }, ref ) => (
		<Text
			ref={ ref }
			variant="body-md"
			className={ clsx( styles.itemLabel, className ) }
			{ ...props }
		/>
	)
);
ItemLabel.displayName = 'Menu.ItemLabel';

export { ItemLabel };
