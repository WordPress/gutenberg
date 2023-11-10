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
	isValidElement,
	useCallback,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { check, chevronRightSmall } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../context';
import type { WordPressComponentProps } from '../context';
import Icon from '../icon';
import type {
	DropdownMenuContext as DropdownMenuContextType,
	DropdownMenuProps,
	DropdownMenuGroupProps,
	DropdownMenuItemProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuRadioItemProps,
	DropdownMenuSeparatorProps,
} from './types';
import * as Styled from './styles';

export const DropdownMenuContext = createContext<
	DropdownMenuContextType | undefined
>( undefined );

export const DropdownMenuItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuItemProps, 'div', false >
>( function DropdownMenuItem(
	{ prefix, suffix, children, hideOnClick = true, ...props },
	ref
) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	return (
		<Styled.DropdownMenuItem
			ref={ ref }
			{ ...props }
			hideOnClick={ hideOnClick }
			store={ dropdownMenuContext?.store }
		>
			{ prefix && (
				<Styled.ItemPrefixWrapper>{ prefix }</Styled.ItemPrefixWrapper>
			) }

			<Styled.DropdownMenuItemContentWrapper>
				{ children }
			</Styled.DropdownMenuItemContentWrapper>

			{ suffix && (
				<Styled.ItemSuffixWrapper>{ suffix }</Styled.ItemSuffixWrapper>
			) }
		</Styled.DropdownMenuItem>
	);
} );

export const DropdownMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuCheckboxItemProps, 'div', false >
>( function DropdownMenuCheckboxItem(
	{ suffix, children, hideOnClick = false, ...props },
	ref
) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	return (
		<Styled.DropdownMenuCheckboxItem
			ref={ ref }
			{ ...props }
			hideOnClick={ hideOnClick }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ dropdownMenuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
			>
				<Icon icon={ check } size={ 24 } />
			</Ariakit.MenuItemCheck>

			<Styled.DropdownMenuItemContentWrapper>
				{ children }
			</Styled.DropdownMenuItemContentWrapper>

			{ suffix && (
				<Styled.ItemSuffixWrapper>{ suffix }</Styled.ItemSuffixWrapper>
			) }
		</Styled.DropdownMenuCheckboxItem>
	);
} );

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

export const DropdownMenuRadioItem = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuRadioItemProps, 'div', false >
>( function DropdownMenuRadioItem(
	{ suffix, children, hideOnClick = false, ...props },
	ref
) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	return (
		<Styled.DropdownMenuRadioItem
			ref={ ref }
			{ ...props }
			hideOnClick={ hideOnClick }
			store={ dropdownMenuContext?.store }
		>
			<Ariakit.MenuItemCheck
				store={ dropdownMenuContext?.store }
				render={ <Styled.ItemPrefixWrapper /> }
			>
				<Icon icon={ radioCheck } size={ 24 } />
			</Ariakit.MenuItemCheck>

			<Styled.DropdownMenuItemContentWrapper>
				{ children }
			</Styled.DropdownMenuItemContentWrapper>

			{ suffix }
		</Styled.DropdownMenuRadioItem>
	);
} );

export const DropdownMenuGroup = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuGroupProps, 'div', false >
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

const UnconnectedDropdownMenu = (
	props: WordPressComponentProps< DropdownMenuProps, 'div', false >,
	ref: React.ForwardedRef< HTMLDivElement >
) => {
	const {
		// Store props
		open,
		defaultOpen = false,
		onOpenChange,
		placement,

		// Menu trigger props
		trigger,

		// Menu props
		gutter,
		children,
		shift,
		modal = true,

		// From internal components context
		variant,

		// Rest
		...otherProps
	} = useContextSystem<
		typeof props & Pick< DropdownMenuContextType, 'variant' >
	>( props, 'DropdownMenu' );

	const parentContext = useContext( DropdownMenuContext );

	const computedDirection = isRTL() ? 'rtl' : 'ltr';

	// If an explicit value for the `placement` prop is not passed,
	// apply a default placement of `bottom-start` for the root dropdown,
	// and of `right-start` for nested dropdowns.
	let computedPlacement =
		props.placement ??
		( parentContext?.store ? 'right-start' : 'bottom-start' );
	// Swap left/right in case of RTL direction
	if ( computedDirection === 'rtl' ) {
		if ( /right/.test( computedPlacement ) ) {
			computedPlacement = computedPlacement.replace(
				'right',
				'left'
			) as typeof computedPlacement;
		} else if ( /left/.test( computedPlacement ) ) {
			computedPlacement = computedPlacement.replace(
				'left',
				'right'
			) as typeof computedPlacement;
		}
	}

	const dropdownMenuStore = Ariakit.useMenuStore( {
		parent: parentContext?.store,
		open,
		defaultOpen,
		placement: computedPlacement,
		focusLoop: true,
		setOpen( willBeOpen ) {
			onOpenChange?.( willBeOpen );
		},
		rtl: computedDirection === 'rtl',
	} );

	const contextValue = useMemo(
		() => ( { store: dropdownMenuStore, variant } ),
		[ dropdownMenuStore, variant ]
	);

	// Extract the side from the applied placement — useful for animations.
	const appliedPlacementSide = dropdownMenuStore
		.useState( 'placement' )
		.split( '-' )[ 0 ];

	if (
		dropdownMenuStore.parent &&
		! ( isValidElement( trigger ) && DropdownMenuItem === trigger.type )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			'For nested DropdownMenus, the `trigger` should always be a `DropdownMenuItem`.'
		);
	}

	const hideOnEscape = useCallback(
		( event: React.KeyboardEvent< Element > ) => {
			// Pressing Escape can cause unexpected consequences (ie. exiting
			// full screen mode on MacOs, close parent modals...).
			event.preventDefault();
			// Returning `true` causes the menu to hide.
			return true;
		},
		[]
	);

	const wrapperProps = useMemo(
		() => ( {
			dir: computedDirection,
			style: {
				direction:
					computedDirection as React.CSSProperties[ 'direction' ],
			},
		} ),
		[ computedDirection ]
	);

	return (
		<>
			{ /* Menu trigger */ }
			<Ariakit.MenuButton
				ref={ ref }
				store={ dropdownMenuStore }
				render={
					dropdownMenuStore.parent
						? cloneElement( trigger, {
								// Add submenu arrow, unless a `suffix` is explicitly specified
								suffix: trigger.props.suffix ?? (
									<Styled.SubmenuChevronIcon
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
			<Styled.DropdownMenu
				{ ...otherProps }
				modal={ modal }
				store={ dropdownMenuStore }
				gutter={ gutter ?? ( dropdownMenuStore.parent ? 16 : 8 ) }
				shift={ shift ?? ( dropdownMenuStore.parent ? -8 : 0 ) }
				hideOnHoverOutside={ false }
				data-side={ appliedPlacementSide }
				variant={ variant }
				wrapperProps={ wrapperProps }
				hideOnEscape={ hideOnEscape }
				unmountOnHide
			>
				<DropdownMenuContext.Provider value={ contextValue }>
					{ children }
				</DropdownMenuContext.Provider>
			</Styled.DropdownMenu>
		</>
	);
};
export const DropdownMenu = contextConnect(
	UnconnectedDropdownMenu,
	'DropdownMenu'
);

export const DropdownMenuSeparator = forwardRef<
	HTMLHRElement,
	WordPressComponentProps< DropdownMenuSeparatorProps, 'hr', false >
>( function DropdownMenuSeparator( props, ref ) {
	const dropdownMenuContext = useContext( DropdownMenuContext );
	return (
		<Styled.DropdownMenuSeparator
			ref={ ref }
			{ ...props }
			store={ dropdownMenuContext?.store }
			variant={ dropdownMenuContext?.variant }
		/>
	);
} );

export const DropdownMenuItemHelpText = forwardRef<
	HTMLHRElement,
	WordPressComponentProps< { children: React.ReactNode }, 'span', true >
>( function DropdownMenuItemHelpText( props, ref ) {
	return (
		<Styled.DropdownMenuItemHelpText
			numberOfLines={ 2 }
			ref={ ref }
			{ ...props }
		/>
	);
} );
