/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { View } from '../view';
import * as styles from './styles';

/**
 * `Menu` is an actionable component that displays a list of actions, links, or informative content.
 *
 * @example
 * ```jsx
 * <Menu>
 *  <MenuItem>...</MenuItem>
 *  <MenuItem>...</MenuItem>
 *  <MenuItem>...</MenuItem>
 * </Menu>
 * ```
 *
 * @see https://reakit.io/docs/menu/#menu
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function Menu( props, forwardedRef ) {
	const { children, className, ...otherProps } = useContextSystem(
		props,
		'Menu'
	);

	const classes = cx( styles.Menu, className );

	return (
		<View { ...otherProps } className={ classes } ref={ forwardedRef }>
			{ children }
		</View>
	);
}

/**
 * `Menu` is an actionable component that displays a list of actions, links, or informative content.
 *
 * @example
 * ```jsx
 * <Menu>
 *  <MenuItem>...</MenuItem>
 *  <MenuItem>...</MenuItem>
 *  <MenuItem>...</MenuItem>
 * </Menu>
 * ```
 *
 * @see https://reakit.io/docs/menu/#menu
 */
const ConnectedMenu = contextConnect( Menu, 'Menu' );

export default ConnectedMenu;
