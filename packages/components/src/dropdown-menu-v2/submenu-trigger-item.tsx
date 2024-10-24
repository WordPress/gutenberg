/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import { chevronRightSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { DropdownMenuSubmenuTriggerItemProps } from './types';
import { DropdownMenuContext } from './context';
import { DropdownMenuItem } from './item';
import * as Styled from './styles';

export const DropdownMenuSubmenuTriggerItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuSubmenuTriggerItemProps, 'div', false >
>( function DropdownMenuSubmenuTriggerItem( { suffix, ...otherProps }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store.parent ) {
		throw new Error(
			'DropdownMenu.SubmenuTriggerItem can only be rendered inside a nested DropdownMenu component'
		);
	}

	return (
		<Ariakit.MenuButton
			ref={ ref }
			accessibleWhenDisabled
			store={ dropdownMenuContext.store }
			render={
				<DropdownMenuItem
					{ ...otherProps }
					// The menu item needs to register and be part of the parent menu
					store={ dropdownMenuContext.store.parent }
					suffix={
						<>
							{ suffix }
							<Styled.SubmenuChevronIcon
								aria-hidden="true"
								icon={ chevronRightSmall }
								size={ 24 }
								preserveAspectRatio="xMidYMid slice"
							/>
						</>
					}
				/>
			}
		/>
	);
} );
