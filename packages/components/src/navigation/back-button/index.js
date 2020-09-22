/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { MenuBackButtonUI } from '../styles/navigation-styles';

export default function NavigationBackButton( {
	backButtonLabel,
	className,
	href,
	onClick,
	parentMenu,
} ) {
	const { setActiveMenu, navigationTree } = useNavigationContext();

	const classes = classnames(
		'components-navigation__back-button',
		className
	);

	const parentMenuTitle = navigationTree.getMenu( parentMenu )?.title;

	return (
		<MenuBackButtonUI
			className={ classes }
			isTertiary
			href={ href }
			onClick={ () =>
				parentMenu ? setActiveMenu( parentMenu, 'right' ) : onClick
			}
		>
			<Icon icon={ chevronLeft } />
			{ backButtonLabel || parentMenuTitle || __( 'Back' ) }
		</MenuBackButtonUI>
	);
}
