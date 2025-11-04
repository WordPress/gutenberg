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
}

export default function NavigationItem( {
	className,
	icon,
	shouldShowPlaceholder = true,
	children,
	to,
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

	if ( isExternal ) {
		// Render as a regular anchor tag for external URLs
		return (
			<Item
				as="a"
				href={ to }
				className={ clsx( 'boot-navigation-item', className ) }
			>
				{ content }
			</Item>
		);
	}

	return (
		<RouterLinkItem
			to={ to }
			className={ clsx( 'boot-navigation-item', className ) }
		>
			{ content }
		</RouterLinkItem>
	);
}
