/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { GroupTitleUI } from '../styles/navigation-styles';
import { useNavigationContext } from '../context';

export default function NavigationGroup( { children, className, title } ) {
	const { navigationTree } = useNavigationContext();

	let isGroupEmpty = true;
	Children.forEach( children, ( { props } ) => {
		if ( navigationTree.getItem( props.item )?._isVisible ) {
			isGroupEmpty = false;
		}
	} );

	// Keep the children rendered to make sure invisible items are included in the navigation tree.
	if ( isGroupEmpty ) {
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
