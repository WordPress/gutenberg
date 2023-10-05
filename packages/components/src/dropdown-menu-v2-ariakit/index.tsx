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
import { check, chevronRightSmall } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import type {
	DropdownMenuContext as DropdownMenuContextType,
	DropdownMenuProps,
	DropdownMenuGroupProps,
	DropdownMenuGroupLabelProps,
	DropdownMenuItemProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuSeparatorProps,
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
			{ prefix && (
				<Styled.ItemPrefixWrapper>{ prefix }</Styled.ItemPrefixWrapper>
			) }
			{ children }
			{ suffix && (
				<Styled.ItemSuffixWrapper>{ suffix }</Styled.ItemSuffixWrapper>
			) }
		</Styled.DropdownMenuItem>
	);
} );

export const DropdownMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	DropdownMenuCheckboxItemProps
>( function DropdownMenuCheckboxItem( { suffix, children, ...props }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	const onChangeWithTargetValue: typeof props.onChange = ( e ) => {
		props.onChange?.( {
			...e,
			target: Object.assign( e.target, { value: props.value } ),
		} );
	};

	// This can't be currently done because of
	// https://github.com/ariakit/ariakit/blob/main/packages/ariakit-react-core/src/menu/menu-item-check.ts
	// But using `Ariakit.MenuItemCheck` works as expected.
	// const isChecked = dropdownMenuContext?.store.useState( ( state ) => {
	// 	// state.values doesn't have a property with key [props.name] when empty
	// 	const checkedOrValues = state.values[ props.name ];
	// 	return Array.isArray( checkedOrValues )
	// 		? checkedOrValues.includes( props.value )
	// 		: checkedOrValues;
	// } );

	return (
		<Styled.DropdownMenuCheckboxItem
			ref={ ref }
			{ ...props }
			onChange={ onChangeWithTargetValue }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ dropdownMenuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
			>
				<Icon icon={ check } size={ 24 } />
			</Ariakit.MenuItemCheck>

			{ /* <Styled.ItemPrefixWrapper>
				{ isChecked ? <Icon icon={ check } size={ 24 } /> : null }
			</Styled.ItemPrefixWrapper> */ }

			{ children }
			{ suffix && (
				<Styled.ItemSuffixWrapper>{ suffix }</Styled.ItemSuffixWrapper>
			) }
		</Styled.DropdownMenuCheckboxItem>
	);
} );

export const DropdownMenuRadioItem = forwardRef<
	HTMLDivElement,
	DropdownMenuCheckboxItemProps
>( function DropdownMenuRadioItem( { suffix, children, ...props }, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	const onChangeWithTargetValue: typeof props.onChange = ( e ) => {
		props.onChange?.( {
			...e,
			target: Object.assign( e.target, { value: props.value } ),
		} );
	};

	return (
		<Styled.DropdownMenuRadioItem
			ref={ ref }
			{ ...props }
			onChange={ onChangeWithTargetValue }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ dropdownMenuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
			>
				<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<Circle
						cx={ 12 }
						cy={ 12 }
						r={ 3 }
						fill="currentColor"
					></Circle>
				</SVG>
			</Ariakit.MenuItemCheck>
			{ children }
			{ suffix }
		</Styled.DropdownMenuRadioItem>
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
			placement,
			gutter = 8,
			shift = 0,
			defaultValues,
			modal = true,
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
			placement,
			// TODO: can we remove this prop?
			defaultValues,
			focusLoop: true,
			setOpen( willBeOpen ) {
				onOpenChange?.( willBeOpen );
			},
		} );

		const contextValue = useMemo(
			() => ( { store: dropdownMenuStore } ),
			[ dropdownMenuStore ]
		);

		const shouldShowDropdownMenu = dropdownMenuStore.useState( 'open' );

		// Extract the side part from the placement (ie. top/bottom/left/start)
		// It is useful to animate the opening of the menu in the right direction.
		const computedPlacement = dropdownMenuStore.useState( 'placement' );
		const side = computedPlacement.split( '-' )[ 0 ];

		return (
			<>
				{ /* Menu trigger */ }
				<Ariakit.MenuButton
					ref={ ref }
					store={ dropdownMenuStore }
					render={
						// Add arrow for submenus
						dropdownMenuStore.parent
							? // TODO: check that `trigger` renders a `DropdownMenuItem`?
							  cloneElement( trigger, {
									// TODO: add prefix
									suffix: trigger.props.suffix ?? (
										<Styled.SubmenuRtlChevronIcon
											aria-hidden="true"
											icon={ chevronRightSmall }
											size={ 24 }
										/>
									),
							  } )
							: trigger
					}
				/>

				{ /* Menu popover */ }
				{ shouldShowDropdownMenu && (
					<Styled.DropdownMenu
						{ ...props }
						modal={ modal }
						store={ dropdownMenuStore }
						gutter={ dropdownMenuStore.parent ? 16 : gutter }
						shift={ dropdownMenuStore.parent ? -8 : shift }
						hideOnHoverOutside={ false }
						data-side={ side }
					>
						<DropdownMenuContext.Provider value={ contextValue }>
							{ children }
						</DropdownMenuContext.Provider>
					</Styled.DropdownMenu>
				) }
			</>
		);
	}
);

export const DropdownMenuSeparator = forwardRef<
	HTMLHRElement,
	DropdownMenuSeparatorProps
>( function DropdownMenuSeparator( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuSeparator
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
		/>
	);
} );
