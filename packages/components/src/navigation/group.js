/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { MenuGroupTitleUI } from './styles/navigation-styles';

export default function NavigationGroup( { children, className, title } ) {
	const classes = classnames(
		'components-navigation__menu-group',
		className
	);

	return (
		<div className={ classes }>
			{ title && (
				<MenuGroupTitleUI
					as="h3"
					className="components-navigation__menu-group-title"
					variant="caption"
				>
					{ title }
				</MenuGroupTitleUI>
			) }
			<ul>{ children }</ul>
		</div>
	);
}
