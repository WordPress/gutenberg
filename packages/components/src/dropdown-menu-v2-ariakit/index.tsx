/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	createContext,
	useContext,
	useMemo,
	cloneElement,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	DropdownMenuContext as DropdownMenuContextType,
	DropdownMenuProps,
	DropdownMenuGroupProps,
	DropdownMenuGroupLabelProps,
	DropdownMenuItemProps,
	DropdownMenuCheckboxItemProps,
} from './types';
import * as Styled from './styles';

export const DropdownMenuContext = createContext<
	DropdownMenuContextType | undefined
>( undefined );

export const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	DropdownMenuItemProps
>( function DropdownMenuItem( { prefix, suffix, children, ...props }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuItem
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		>
			{ prefix }
			{ children }
			{ suffix }
		</Styled.DropdownMenuItem>
	);
} );

export const DropdownMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	DropdownMenuCheckboxItemProps
>( function DropdownMenuCheckboxItem( { suffix, children, ...props }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuCheckboxItem
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck store={ dropdownMenuContext?.store } />
			{ children }
			{ suffix }
		</Styled.DropdownMenuCheckboxItem>
	);
} );

export const DropdownMenuGroup = forwardRef<
	HTMLDivElement,
	DropdownMenuGroupProps
>( function DropdownMenuGroup( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuGroup
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );

export const DropdownMenuGroupLabel = forwardRef<
	HTMLDivElement,
	DropdownMenuGroupLabelProps
>( function DropdownMenuGroupLabel( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuGroupLabel
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );

export const DropdownMenu = forwardRef< HTMLDivElement, DropdownMenuProps >(
	function DropdownMenu(
		{
			// Menu trigger props
			trigger,
			// Menu props
			children,
			open,
			defaultOpen,
			onOpenChange,
			...props
		},
		// Menu ref
		ref
	) {
		const parentContext = useContext( DropdownMenuContext );

		const dropdownMenuStore = Ariakit.useMenuStore( {
			parent: parentContext?.store,
			open,
			defaultOpen,
			setOpen( willBeOpen ) {
				onOpenChange?.( willBeOpen );
			},
		} );

		const contextValue = useMemo(
			() => ( { store: dropdownMenuStore } ),
			[ dropdownMenuStore ]
		);

		return (
			<>
				{ /* Menu trigger */ }
				<Ariakit.MenuButton
					ref={ ref }
					store={ dropdownMenuStore }
					render={
						// Add arrow for submenus
						dropdownMenuStore.parent
							? cloneElement( trigger, {
									// TODO: add prefix
									suffix: trigger.props.suffix ?? (
										<Ariakit.MenuButtonArrow />
									),
							  } )
							: trigger
					}
				/>

				{ /* Menu popover */ }
				<Styled.DropdownMenu
					{ ...props }
					store={ dropdownMenuStore }
					gutter={ dropdownMenuStore.parent ? 16 : 8 }
					shift={ dropdownMenuStore.parent ? -9 : 0 }
					hideOnHoverOutside={ false }
				>
					<DropdownMenuContext.Provider value={ contextValue }>
						{ children }
					</DropdownMenuContext.Provider>
				</Styled.DropdownMenu>
			</>
		);
	}
);
