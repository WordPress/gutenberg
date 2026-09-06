import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { Circle, SVG } from '@wordpress/primitives';
import { Icon } from '../icon';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { RadioItemProps } from './types';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 } />
	</SVG>
);

/**
 * Renders a menu item that works like a radio button in a group.
 */
const RadioItem = forwardRef< HTMLDivElement, RadioItemProps >(
	function MenuRadioItem(
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
			<_Menu.RadioItem
				ref={ ref }
				{ ...itemAriaProps }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.item,
					className
				) }
				{ ...props }
			>
				<_Menu.RadioItemIndicator
					keepMounted
					className={ styles[ 'item-selection-indicator' ] }
				>
					<Icon
						icon={ radioCheck }
						className={ styles[ 'radio-selection-icon' ] }
						aria-hidden="true"
					/>
				</_Menu.RadioItemIndicator>
				<MenuItemContentContext.Provider value={ contentContextValue }>
					<ItemContent
						prefix={ prefix }
						shortcut={ shortcut }
						shortcutDescriptionId={ shortcutDescriptionId }
						suffix={ suffix }
					>
						{ contentChildren }
					</ItemContent>
				</MenuItemContentContext.Provider>
			</_Menu.RadioItem>
		);
	}
);

export { RadioItem };
