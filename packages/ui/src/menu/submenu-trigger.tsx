import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { chevronRightSmall } from '@wordpress/icons';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { SubmenuTriggerProps } from './types';

/**
 * Renders a menu item that opens a submenu.
 */
const SubmenuTrigger = forwardRef< HTMLDivElement, SubmenuTriggerProps >(
	function MenuSubmenuTrigger(
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
		const {
			contentChildren,
			contentContextValue,
			itemAriaProps,
			shortcutDescriptionId,
		} = useItemContent( children, {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			shortcut,
		} );

		return (
			<_Menu.SubmenuTrigger
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.item,
					className
				) }
				{ ...props }
			>
				<MenuItemContentContext.Provider value={ contentContextValue }>
					<ItemContent
						prefix={ prefix }
						shortcut={ shortcut }
						shortcutDescriptionId={ shortcutDescriptionId }
						suffix={ suffix }
						trailing={
							<Icon
								className={ styles[ 'submenu-chevron' ] }
								icon={ chevronRightSmall }
								size={ 24 }
								aria-hidden="true"
							/>
						}
					>
						{ contentChildren }
					</ItemContent>
				</MenuItemContentContext.Provider>
			</_Menu.SubmenuTrigger>
		);
	}
);

export { SubmenuTrigger };
