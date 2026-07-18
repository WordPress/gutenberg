import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { check } from '@wordpress/icons';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import {
	ItemLayout,
	ItemLayoutContext,
	useItemContent,
} from '../utils/item-layout';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import styles from './style.module.css';
import type { CheckboxItemProps } from './types';

/**
 * Renders a menu item that toggles a setting on or off.
 */
const CheckboxItem = forwardRef< HTMLDivElement, CheckboxItemProps >(
	function MenuCheckboxItem(
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
			<_Menu.CheckboxItem
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
						selectionIndicator={
							<_Menu.CheckboxItemIndicator keepMounted>
								<Icon
									icon={ check }
									size={ 24 }
									aria-hidden="true"
								/>
							</_Menu.CheckboxItemIndicator>
						}
						shortcut={ shortcut }
						shortcutDescriptionId={ shortcutDescriptionId }
						suffix={ suffix }
					>
						{ children }
					</ItemLayout>
				</ItemLayoutContext.Provider>
			</_Menu.CheckboxItem>
		);
	}
);

export { CheckboxItem };
