import { Menu as _Menu } from '@base-ui/react/menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import { MenuItemContentContext } from './context';
import { ItemContent, useItemContent } from './item';
import type { LinkItemProps } from './types';

/**
 * Renders a menu item that navigates to a link target.
 */
const LinkItem = forwardRef< Element, LinkItemProps >( function MenuLinkItem(
	{
		children,
		className,
		openInNewTab = false,
		prefix,
		shortcut,
		suffix,
		'aria-describedby': ariaDescribedBy,
		'aria-keyshortcuts': ariaKeyShortcuts,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		rel,
		...props
	},
	ref
) {
	const externalLinkIndicator = openInNewTab ? (
		<span
			className={ styles[ 'external-link-indicator' ] }
			role="img"
			aria-label={
				/* translators: accessibility text appended to link text */
				__( '(opens in a new tab)' )
			}
		/>
	) : null;
	const { contentContextValue, itemAriaProps, shortcutDescriptionId } =
		useItemContent( children, {
			'aria-describedby': ariaDescribedBy,
			'aria-keyshortcuts': ariaKeyShortcuts,
			'aria-label': ariaLabel,
			'aria-labelledby': ariaLabelledBy,
			labelTrailing: externalLinkIndicator,
			shortcut,
		} );

	return (
		<_Menu.LinkItem
			ref={ ref }
			{ ...props }
			{ ...itemAriaProps }
			rel={ rel }
			target={ openInNewTab ? '_blank' : undefined }
			className={ clsx(
				defenseStyles.a,
				resetStyles[ 'box-sizing' ],
				styles.item,
				className
			) }
		>
			<MenuItemContentContext.Provider value={ contentContextValue }>
				<ItemContent
					prefix={ prefix }
					shortcut={ shortcut }
					shortcutDescriptionId={ shortcutDescriptionId }
					suffix={ suffix }
				>
					{ children }
				</ItemContent>
			</MenuItemContentContext.Provider>
		</_Menu.LinkItem>
	);
} );

export { LinkItem };
