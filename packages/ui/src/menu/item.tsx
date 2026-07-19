import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import {
	ItemLayout,
	ItemLayoutContext,
	useItemContent,
} from '../utils/item-layout';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import styles from './style.module.css';
import type { ItemProps } from './types';

/**
 * Renders an individual menu item.
 */
const Item = forwardRef< HTMLDivElement, ItemProps >( function MenuItem(
	{
		children,
		className,
		prefix,
		shortcut,
		suffix,
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		...props
	},
	ref
) {
	const { contentContextValue, itemAriaProps, shortcutDescriptionId } =
		useItemContent( children, {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			shortcut,
		} );

	return (
		<_Menu.Item
			ref={ ref }
			{ ...itemAriaProps }
			className={ clsx(
				resetStyles[ 'box-sizing' ],
				itemLayoutStyles.item,
				styles.item,
				className
			) }
			{ ...props }
		>
			<ItemLayoutContext.Provider value={ contentContextValue }>
				<ItemLayout
					prefix={ prefix }
					shortcut={ shortcut }
					shortcutDescriptionId={ shortcutDescriptionId }
					suffix={ suffix }
				>
					{ children }
				</ItemLayout>
			</ItemLayoutContext.Provider>
		</_Menu.Item>
	);
} );

export { Item };
