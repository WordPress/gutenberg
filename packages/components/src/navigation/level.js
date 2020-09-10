/**
 * WordPress dependencies
 */
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useNavigationContext } from './context';
import { DEFAULT_LEVEL } from './constants';
import { BackButtonUI, MenuTitleUI, MenuUI } from './styles/navigation-styles';

export default function NavigationLevel( {
	children,
	level = DEFAULT_LEVEL,
	parentLevel,
	parentLevelTitle,
	title,
} ) {
	const { activeLevel, setActiveLevel } = useNavigationContext();

	if ( activeLevel !== level ) {
		return null;
	}

	return (
		<div className="components-navigation__level">
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
