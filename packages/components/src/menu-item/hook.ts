// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { cloneElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../utils/hooks/use-cx';
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import * as styles from './styles';
import type { MenuItemProps } from './types';

export function useMenuItemGroup(
	props: WordPressComponentProps< MenuItemProps, 'div' >
) {
	let {
		children,
		info,
		className,
		icon,
		iconPosition = 'right',
		shortcut,
		isSelected,
		role = 'menuitem',
		...otherProps
	} = useContextSystem( props, 'MenuGroup' );

	const ariaChecked =
		role === 'menuitemcheckbox' || role === 'menuitemradio'
			? isSelected
			: undefined;

	className = classnames( 'components-menu-item__button', className );

	if ( icon && typeof icon !== 'string' ) {
		icon = cloneElement( icon, {
			className: classnames( 'components-menu-items__item-icon', {
				'has-icon-right': iconPosition === 'right',
			} ),
		} );
	}

	/*	const cx = useCx();
	const menuGroupClassName = useMemo( () => {
		return cx(
			styles.MenuGroup,
			hideSeparator && styles.MenuGroupWithHiddenSeparator,
			className
		);
	}, [ className, hideSeparator ] );

	const menuGroupLabelClassName = useMemo( () => {
		return cx( styles.MenuGroupLabel, 'components-menu-group__label' );
	}, [] );*/

	return {
		...otherProps,
		isAriaChecked,
		children,
		info,
		className,
		icon,
		iconPosition,
		shortcut,
		isSelected,
		role,
	};
}
