/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import { useStoreState } from '@ariakit/react';

/**
 * WordPress dependencies
 */
import {
	useContext,
	useMemo,
	cloneElement,
	isValidElement,
	useCallback,
} from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { chevronRightSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../context';
import type { WordPressComponentProps } from '../context';
import type {
	DropdownMenuContext as DropdownMenuContextType,
	DropdownMenuProps,
} from './types';
import * as Styled from './styles';
import { DropdownMenuContext } from './context';
import { DropdownMenuItem } from './item';
import { DropdownMenuCheckboxItem } from './checkbox-item';
import { DropdownMenuRadioItem } from './radio-item';
import { DropdownMenuGroup } from './group';
import { DropdownMenuGroupLabel } from './group-label';
import { DropdownMenuSeparator } from './separator';
import { DropdownMenuItemLabel } from './item-label';
import { DropdownMenuItemHelpText } from './item-help-text';

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
	// Using `currentPlacement` instead of `placement` to make sure that we
	// use the final computed placement (including "flips" etc).
	const appliedPlacementSide = useStoreState(
		dropdownMenuStore,
		'currentPlacement'
	).split( '-' )[ 0 ];

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
								suffix: (
									<>
										{ trigger.props.suffix }
										<Styled.SubmenuChevronIcon
											aria-hidden="true"
											icon={ chevronRightSmall }
											size={ 24 }
											preserveAspectRatio="xMidYMid slice"
										/>
									</>
								),
						  } )
						: trigger
				}
			/>

			{ /* Menu popover */ }
			<Ariakit.Menu
				{ ...otherProps }
				modal={ modal }
				store={ dropdownMenuStore }
				// Root menu has an 8px distance from its trigger,
				// otherwise 0 (which causes the submenu to slightly overlap)
				gutter={ gutter ?? ( dropdownMenuStore.parent ? 0 : 8 ) }
				// Align nested menu by the same (but opposite) amount
				// as the menu container's padding.
				shift={ shift ?? ( dropdownMenuStore.parent ? -4 : 0 ) }
				hideOnHoverOutside={ false }
				data-side={ appliedPlacementSide }
				wrapperProps={ wrapperProps }
				hideOnEscape={ hideOnEscape }
				unmountOnHide
				render={ ( renderProps ) => (
					// Two wrappers are needed for the entry animation, where the menu
					// container scales with a different factor than its contents.
					// The {...renderProps} are passed to the inner wrapper, so that the
					// menu element is the direct parent of the menu item elements.
					<Styled.MenuPopoverOuterWrapper variant={ variant }>
						<Styled.MenuPopoverInnerWrapper { ...renderProps } />
					</Styled.MenuPopoverOuterWrapper>
				) }
			>
				<DropdownMenuContext.Provider value={ contextValue }>
					{ children }
				</DropdownMenuContext.Provider>
			</Ariakit.Menu>
		</>
	);
};

export const DropdownMenuV2 = Object.assign(
	contextConnect( UnconnectedDropdownMenu, 'DropdownMenu' ),
	{
		Context: Object.assign( DropdownMenuContext, {
			displayName: 'DropdownMenuV2.Context',
		} ),
		Item: Object.assign( DropdownMenuItem, {
			displayName: 'DropdownMenuV2.Item',
		} ),
		RadioItem: Object.assign( DropdownMenuRadioItem, {
			displayName: 'DropdownMenuV2.RadioItem',
		} ),
		CheckboxItem: Object.assign( DropdownMenuCheckboxItem, {
			displayName: 'DropdownMenuV2.CheckboxItem',
		} ),
		Group: Object.assign( DropdownMenuGroup, {
			displayName: 'DropdownMenuV2.Group',
		} ),
		GroupLabel: Object.assign( DropdownMenuGroupLabel, {
			displayName: 'DropdownMenuV2.GroupLabel',
		} ),
		Separator: Object.assign( DropdownMenuSeparator, {
			displayName: 'DropdownMenuV2.Separator',
		} ),
		ItemLabel: Object.assign( DropdownMenuItemLabel, {
			displayName: 'DropdownMenuV2.ItemLabel',
		} ),
		ItemHelpText: Object.assign( DropdownMenuItemHelpText, {
			displayName: 'DropdownMenuV2.ItemHelpText',
		} ),
	}
);

export default DropdownMenuV2;
