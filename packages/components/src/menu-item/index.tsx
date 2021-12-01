/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import Shortcut from '../shortcut';
import Button from '../button';
import Icon from '../icon';
import { useMenuItemGroup } from './hook';
import type { MenuItemProps, MenuItemInfoWrapperProps } from './types';
import { contextConnect, WordPressComponentProps } from '../ui/context';

function MenuItemInfoWrapper( { info, children }: MenuItemInfoWrapperProps ) {
	if ( info ) {
		return (
			<span className="components-menu-item__info-wrapper">
				<span className="components-menu-item__item">{ children }</span>
				<span className="components-menu-item__info">{ info }</span>
			</span>
		);
	}
	return <> { children } </>;
}

export function MenuItem(
	props: WordPressComponentProps< MenuItemProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		isAriaChecked,
		children,
		info,
		className,
		icon,
		iconPosition,
		shortcut,
		isSelected,
		role,
		...buttonProps
	} = useMenuItemGroup( props );

	return (
		<Button
			ref={ forwardedRef }
			// Make sure aria-checked matches spec https://www.w3.org/TR/wai-aria-1.1/#aria-checked
			aria-checked={ isAriaChecked }
			role={ role }
			icon={ iconPosition === 'left' ? icon : undefined }
			className={ className }
			{ ...buttonProps }
		>
			<span className="components-menu-item__item">
				<MenuItemInfoWrapper info={ info }>
					{ children }
				</MenuItemInfoWrapper>
			</span>
			<Shortcut
				className="components-menu-item__shortcut"
				shortcut={ shortcut }
			/>
			{ icon && iconPosition === 'right' && <Icon icon={ icon } /> }
		</Button>
	);
}

/**
 * `MenuItem` is a component which renders a button intended to be used in combination with the `MenuGroup`.
 *
 * @example
 * ```jsx
 * import { MenuGroup, MenuItem } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *      <MenuGroup label="Settings">
 *          <MenuItem>Setting 1</MenuItem>
 *          <MenuItem>Setting 2</MenuItem>
 *      </MenuGroup>
 *   );
 * }
 * ```
 */
const ConnectedMenuItem = contextConnect( MenuItem, 'MenuItem' );

export default ConnectedMenuItem;
