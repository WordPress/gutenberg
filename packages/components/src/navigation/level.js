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
import { useNavigationContext } from './context';
import { ROOT_LEVEL } from './constants';
import { BackButtonUI, MenuTitleUI, MenuUI } from './styles/navigation-styles';

export default function NavigationLevel( {
	children,
	className,
	level = ROOT_LEVEL,
	parentLevel,
	parentLevelTitle,
	title,
} ) {
	const { activeLevel, setActiveLevel } = useNavigationContext();

	if ( activeLevel !== level ) {
		return null;
	}

	const classes = classnames( 'components-navigation__level', className );

	return (
		<div className={ classes }>
			{ parentLevel && (
				<BackButtonUI
					className="components-navigation__back-button"
					isTertiary
					onClick={ () => setActiveLevel( parentLevel, 'right' ) }
				>
					<Icon icon={ chevronLeft } />
					{ parentLevelTitle }
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
