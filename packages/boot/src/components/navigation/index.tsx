/**
 * WordPress dependencies
 */
import { useState, useMemo, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import NavigationItem from './navigation-item';
import DrilldownItem from './drilldown-item';
import DropdownItem from './dropdown-item';
import NavigationScreen from './navigation-screen';
import { useSidebarParent } from './use-sidebar-parent';
import type { MenuItem } from '../../store/types';

function Navigation() {
	const backButtonRef = useRef< HTMLButtonElement >( null );
	const [ animationDirection, setAnimationDirection ] = useState<
		'forward' | 'backward' | null
	>( null );
	const [ parentId, setParentId, parentDropdownId, setParentDropdownId ] =
		useSidebarParent();
	const menuItems = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems() as MenuItem[],
		[]
	);
	const parent = useMemo(
		() => menuItems.find( ( item ) => item.id === parentId ),
		[ menuItems, parentId ]
	);
	// Create a unique key for the current navigation state
	// The sidebar will animate when the key changes.
	const navigationKey = parent ? `drilldown-${ parent.id }` : 'root';

	// We use transitions to handle navigation clicks
	// This allows smooth animations and non blocking navigation.
	const handleNavigate = ( {
		id,
		direction,
	}: {
		id?: string;
		direction: 'forward' | 'backward';
	} ) => {
		setAnimationDirection( direction );
		setParentId( id );
	};

	const handleDropdownToggle = ( dropdownId: string ) => {
		setParentDropdownId(
			parentDropdownId === dropdownId ? undefined : dropdownId
		);
	};

	const items = useMemo(
		() => menuItems.filter( ( item ) => item.parent === parentId ),
		[ menuItems, parentId ]
	);

	const hasRealIcons = items.some( ( item ) => !! item.icon );

	return (
		<NavigationScreen
			isRoot={ ! parent }
			title={ parent ? parent.label : '' }
			backMenuItem={ parent?.parent }
			backButtonRef={ backButtonRef }
			animationDirection={ animationDirection || undefined }
			navigationKey={ navigationKey }
			onNavigate={ handleNavigate }
			content={
				<>
					{ items.map( ( item: MenuItem ) => {
						if ( item.parent_type === 'dropdown' ) {
							return (
								<DropdownItem
									key={ item.id }
									id={ item.id }
									className="boot-navigation-item"
									icon={ item.icon }
									shouldShowPlaceholder={ hasRealIcons }
									isExpanded={ parentDropdownId === item.id }
									onToggle={ () =>
										handleDropdownToggle( item.id )
									}
								>
									{ item.label }
								</DropdownItem>
							);
						}

						if ( item.parent_type === 'drilldown' ) {
							return (
								<DrilldownItem
									key={ item.id }
									id={ item.id }
									icon={ item.icon }
									shouldShowPlaceholder={ hasRealIcons }
									onNavigate={ handleNavigate }
								>
									{ item.label }
								</DrilldownItem>
							);
						}

						return (
							<NavigationItem
								key={ item.id }
								to={ item.to }
								icon={ item.icon }
								shouldShowPlaceholder={ hasRealIcons }
							>
								{ item.label }
							</NavigationItem>
						);
					} ) }
				</>
			}
		/>
	);
}

export default Navigation;
