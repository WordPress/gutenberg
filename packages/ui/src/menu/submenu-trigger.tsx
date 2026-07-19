import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import {
	ItemChevron,
	ItemLayout,
	ItemLayoutContext,
	useItemContent,
} from '../utils/item-layout';
import itemLayoutStyles from '../utils/item-layout/style.module.css';
import styles from './style.module.css';
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
		const { contentContextValue, itemAriaProps, shortcutDescriptionId } =
			useItemContent( children, {
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
						trailing={
							<ItemChevron
								className={ styles[ 'submenu-chevron' ] }
								direction="inline-end"
							/>
						}
					>
						{ children }
					</ItemLayout>
				</ItemLayoutContext.Provider>
			</_Menu.SubmenuTrigger>
		);
	}
);

export { SubmenuTrigger };
