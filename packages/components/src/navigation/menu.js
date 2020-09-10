/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ROOT_MENU } from './constants';
import { useNavigationContext } from './context';
import { BackButtonUI, MenuTitleUI, MenuUI } from './styles/navigation-styles';

export default function NavigationMenu( {
	children,
	className,
	menu = ROOT_MENU,
	parentMenu,
	parentMenuTitle,
	title,
} ) {
	const { activeMenu, setActiveMenu } = useNavigationContext();

	if ( activeMenu !== menu ) {
		return null;
	}

	const classes = classnames( 'components-navigation__menu', className );

	return (
		<div className={ classes }>
			{ parentMenu && (
				<BackButtonUI
					className="components-navigation__back-button"
					isTertiary
					onClick={ () => setActiveMenu( parentMenu, 'right' ) }
				>
					<Icon icon={ chevronLeft } />
					{ parentMenuTitle }
				</BackButtonUI>
			) }
			<MenuUI>
				{ title && (
					<MenuTitleUI
						as="h2"
						className="components-navigation__menu-title"
						variant="subtitle"
					>
						{ title }
					</MenuTitleUI>
				) }
				{ children }
			</MenuUI>
		</div>
	);
}
