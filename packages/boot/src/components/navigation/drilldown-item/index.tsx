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
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import { chevronRightSmall, chevronLeftSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { wrapIcon } from '../items';
import type { IconType } from '../../../store/types';

interface DrilldownItemProps {
	/**
	 * Optional CSS class name.
	 */
	className?: string;
	/**
	 * Identifier of the navigation item.
	 */
	id: string;
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
	 * Function to handle sidebar navigation when the item is clicked.
	 */
	onNavigate: ( {
		id,
		direction,
	}: {
		id?: string;
		direction: 'forward' | 'backward';
	} ) => void;
}

export default function DrilldownItem( {
	className,
	id,
	icon,
	shouldShowPlaceholder = true,
	children,
	onNavigate,
}: DrilldownItemProps ) {
	const handleClick = ( e: React.MouseEvent ) => {
		e.preventDefault();
		onNavigate( { id, direction: 'forward' } );
	};

	return (
		<Item
			className={ clsx( 'boot-navigation-item', className ) }
			onClick={ handleClick }
		>
			<HStack
				justify="flex-start"
				spacing={ 2 }
				style={ { flexGrow: '1' } }
			>
				{ wrapIcon( icon, shouldShowPlaceholder ) }
				<FlexBlock>{ children }</FlexBlock>
				<Icon icon={ isRTL() ? chevronLeftSmall : chevronRightSmall } />
			</HStack>
		</Item>
	);
}
