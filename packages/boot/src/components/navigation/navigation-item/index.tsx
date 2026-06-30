/**
 * External dependencies
 */
import clsx from 'clsx';
import type { MouseEvent, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	FlexBlock,
	__experimentalItem as Item,
	// @ts-ignore
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import RouterLinkItem from '../router-link-item';
import { wrapIcon } from '../items';
import type { IconType } from '../../../store/types';
import './style.scss';

interface NavigationItemProps {
	/**
	 * Optional CSS class name.
	 */
	className?: string;
	/**
	 * Icon to display with the navigation item.
	 */
	icon?: IconType;
	/**
	 * Whether to show placeholder icons for alignment.
	 */
	shouldShowPlaceholder?: boolean;
	/**
	 * Content to display inside the navigation item.
	 */
	children: ReactNode;
	/**
	 * The path to navigate to.
	 */
	to: string;
	/**
	 * Optional trailing action shown alongside the navigation link.
	 */
	action?: ReactNode;
	/**
	 * Optional click handler for custom navigation behavior.
	 */
	onClick?: ( event: MouseEvent< HTMLAnchorElement > ) => void;
}

export default function NavigationItem( {
	className,
	icon,
	shouldShowPlaceholder = true,
	children,
	to,
	action,
	onClick,
}: NavigationItemProps ) {
	// Check if the 'to' prop is an external URL
	const isExternal = ! String(
		new URL( to, window.location.origin )
	).startsWith( window.location.origin );

	const content = (
		<HStack justify="flex-start" spacing={ 2 } style={ { flexGrow: '1' } }>
			{ wrapIcon( icon, shouldShowPlaceholder ) }
			<FlexBlock>{ children }</FlexBlock>
		</HStack>
	);

	const item = isExternal ? (
		// Render as a regular anchor tag for external URLs
		<Item
			as="a"
			href={ to }
			className={ clsx( 'boot-navigation-item', className ) }
			onClick={ onClick }
		>
			{ content }
		</Item>
	) : (
		<RouterLinkItem
			to={ to }
			className={ clsx( 'boot-navigation-item', className ) }
			onClick={ onClick }
		>
			{ content }
		</RouterLinkItem>
	);

	if ( ! action ) {
		return item;
	}

	return (
		<div className="boot-navigation-item__container">
			{ item }
			<div className="boot-navigation-item__action">{ action }</div>
		</div>
	);
}
