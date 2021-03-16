/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Menu as ReakitMenu } from 'reakit';

/**
 * Internal dependencies
 */
import { usePopoverResizeUpdater } from '../popover/utils';
import { View } from '../view';
import { MenuContext } from './context';
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
	const { as, children, className, menu, ...otherProps } = useContextSystem(
		props,
		'Menu'
	);

	const resizeListener = usePopoverResizeUpdater( {
		onResize: menu?.unstable_update,
	} );

	const contextProps = {
		menu,
	};

	const classes = cx( styles.Menu, className );
	const menuProps = menu || {};
	const Component = as || menu ? ReakitMenu : View;

	return (
		<MenuContext.Provider value={ contextProps }>
			{ /* @ts-ignore TS doesn't like the union of PolymorphicComponent and Reakit Component but they are indeed renderable */ }
			<Component
				hideOnClickOutside={ false }
				{ ...menuProps }
				{ ...otherProps }
				className={ classes }
				ref={ forwardedRef }
			>
				{ resizeListener }
				{ children }
			</Component>
		</MenuContext.Provider>
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
