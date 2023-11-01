/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigationGroupContext } from './context';
import { GroupTitleUI } from '../styles/navigation-styles';
import { useNavigationContext } from '../context';

import type { NavigationGroupProps } from '../types';

let uniqueId = 0;

export function NavigationGroup( {
	children,
	className,
	title,
}: NavigationGroupProps ) {
	const [ groupId ] = useState( `group-${ ++uniqueId }` );
	const {
		navigationTree: { items },
	} = useNavigationContext();

	const context = { group: groupId };

	// Keep the children rendered to make sure invisible items are included in the navigation tree.
	if (
		! Object.values( items ).some(
			( item ) => item.group === groupId && item._isVisible
		)
	) {
		return (
			<NavigationGroupContext.Provider value={ context }>
				{ children }
			</NavigationGroupContext.Provider>
		);
	}

	const groupTitleId = `components-navigation__group-title-${ groupId }`;
	const classes = classnames( 'components-navigation__group', className );

	return (
		<NavigationGroupContext.Provider value={ context }>
			<li className={ classes }>
				{ title && (
					<GroupTitleUI
						className="components-navigation__group-title"
						id={ groupTitleId }
						level={ 3 }
					>
						{ title }
					</GroupTitleUI>
				) }
				<ul aria-labelledby={ groupTitleId } role="group">
					{ children }
				</ul>
			</li>
		</NavigationGroupContext.Provider>
	);
}

export default NavigationGroup;
