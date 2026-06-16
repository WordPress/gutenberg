/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, useRef } from '@wordpress/element';
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
import { useSidebarNavigationLayout } from './use-sidebar-navigation-layout';
import type { MenuItem } from '../../store/types';

function Navigation( {
	onRootChange,
}: {
	onRootChange?: ( isRoot: boolean ) => void;
} ) {
	const backButtonRef = useRef< HTMLButtonElement >( null );
	const [ animationDirection, setAnimationDirection ] = useState<
		'forward' | 'backward' | null
	>( null );
	const menuItems = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems() as MenuItem[],
		[]
	);
	const layout = useSidebarNavigationLayout( menuItems );
	const [ parentId, setParentId, parentDropdownId, setParentDropdownId ] =
		useSidebarParent( layout.getNavigationParentId );
	const parent = useMemo(
		() => layout.getItemById( parentId ),
		[ layout, parentId ]
	);
	const isRoot = ! parent;

	useEffect( () => {
		onRootChange?.( isRoot );
	}, [ isRoot, onRootChange ] );

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

	const items = useMemo( () => {
		if ( ! parentId ) {
			return layout.rootItems;
		}

		return layout.getItemsForParent( parentId );
	}, [ layout, parentId ] );
	const pinnedItems = parentId ? [] : layout.pinnedRootItems;

	const hasRealIcons = [ ...items, ...pinnedItems ].some(
		( item ) => !! item.icon
	);

	const renderItem = ( item: MenuItem ) => {
		if ( item.parent_type === 'dropdown' ) {
			return (
				<DropdownItem
					key={ item.id }
					id={ item.id }
					className="boot-navigation-item"
					icon={ item.icon }
					shouldShowPlaceholder={ hasRealIcons }
					isExpanded={ parentDropdownId === item.id }
					onToggle={ () => handleDropdownToggle( item.id ) }
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
	};

	return (
		<NavigationScreen
			isRoot={ isRoot }
			title={ parent ? parent.label : '' }
			backMenuItem={ parent?.parent }
			backButtonRef={ backButtonRef }
			animationDirection={ animationDirection || undefined }
			navigationKey={ navigationKey }
			onNavigate={ handleNavigate }
			content={
				<div
					role="list"
					className={
						parent ? undefined : 'boot-navigation__root-list'
					}
				>
					<div>{ items.map( renderItem ) }</div>
					{ isRoot && pinnedItems.length > 0 && (
						<div className="boot-navigation__pinned-root-items">
							{ pinnedItems.map( renderItem ) }
						</div>
					) }
				</div>
			}
		/>
	);
}

export default Navigation;
