/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { GroupTitleUI } from './styles/navigation-styles';

export default function NavigationGroup( { children, className, title } ) {
	const classes = classnames( 'components-navigation__group', className );

	return (
		<div className={ classes }>
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
		</div>
	);
}
