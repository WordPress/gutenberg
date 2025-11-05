/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	FlexBlock,
	__experimentalItem as Item,
	// @ts-ignore
	__experimentalHStack as HStack,
	Icon,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { chevronDownSmall } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../../store';
import NavigationItem from '../navigation-item';
import { wrapIcon } from '../items';
import type { IconType, MenuItem } from '../../../store/types';
import './style.scss';

const ANIMATION_DURATION = 0.2;

interface DropdownItemProps {
	/**
	 * Optional CSS class name.
	 */
	className?: string;
	/**
	 * Identifier of the parent menu item.
	 */
	id: string;
	/**
	 * Icon to display with the dropdown item.
	 */
	icon?: IconType;
	/**
	 * Whether to show placeholder icons for alignment.
	 */
	shouldShowPlaceholder?: boolean;
	/**
	 * Content to display inside the dropdown item.
	 */
	children: ReactNode;
	/**
	 * Whether this dropdown is currently expanded.
	 */
	isExpanded: boolean;
	/**
	 * Function to toggle this dropdown's expanded state.
	 */
	onToggle: () => void;
}

export default function DropdownItem( {
	className,
	id,
	icon,
	children,
	isExpanded,
	onToggle,
}: DropdownItemProps ) {
	const menuItems: MenuItem[] = useSelect(
		( select ) =>
			// @ts-ignore
			select( STORE_NAME ).getMenuItems(),
		[]
	);
	const items = menuItems.filter( ( item ) => item.parent === id );
	const disableMotion = useReducedMotion();
	return (
		<div className="boot-dropdown-item">
			<Item
				className={ clsx( 'boot-navigation-item', className ) }
				onClick={ ( e ) => {
					e.preventDefault();
					e.stopPropagation();
					onToggle();
				} }
				onMouseDown={ ( e ) => e.preventDefault() }
			>
				<HStack
					justify="flex-start"
					spacing={ 2 }
					style={ { flexGrow: '1' } }
				>
					{ wrapIcon( icon, false ) }
					<FlexBlock>{ children }</FlexBlock>
					<Icon
						icon={ chevronDownSmall }
						className={ clsx( 'boot-dropdown-item__chevron', {
							'is-up': isExpanded,
						} ) }
					/>
				</HStack>
			</Item>
			<AnimatePresence initial={ false }>
				{ isExpanded && (
					<motion.div
						initial={ { height: 0 } }
						animate={ { height: 'auto' } }
						exit={ { height: 0 } }
						transition={ {
							type: 'tween',
							duration: disableMotion ? 0 : ANIMATION_DURATION,
							ease: 'easeOut',
						} }
						className="boot-dropdown-item__children"
					>
						{ items.map( ( item, index ) => (
							<NavigationItem
								key={ index }
								to={ item.to }
								shouldShowPlaceholder={ false }
							>
								{ item.label }
							</NavigationItem>
						) ) }
					</motion.div>
				) }
			</AnimatePresence>
		</div>
	);
}
