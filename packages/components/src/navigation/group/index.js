/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { GroupTitleUI } from '../styles/navigation-styles';
import { useNavigationMenuContext } from '../menu/context';

export default function NavigationGroup( { children, className, title } ) {
	const { isActive } = useNavigationMenuContext();

	// Keep the children rendered to make sure inactive items are included in the navigation tree
	if ( ! isActive ) {
		return children;
	}

	const classes = classnames( 'components-navigation__group', className );

	return (
		<li className={ classes }>
			{ title && (
				<GroupTitleUI
					as="h3"
					className="components-navigation__group-title"
					variant="caption"
				>
					{ title }
				</GroupTitleUI>
			) }
			<ul>{ children }</ul>
		</li>
	);
}
