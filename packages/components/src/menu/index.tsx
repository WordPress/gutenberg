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
import type { MenuContext as MenuContextType, MenuProps } from './types';
import * as Styled from './styles';
import { MenuContext } from './context';
import { MenuItem } from './item';
import { MenuCheckboxItem } from './checkbox-item';
import { MenuRadioItem } from './radio-item';
import { MenuGroup } from './group';
import { MenuGroupLabel } from './group-label';
import { MenuSeparator } from './separator';
import { MenuItemLabel } from './item-label';
import { MenuItemHelpText } from './item-help-text';

const UnconnectedMenu = (
	props: WordPressComponentProps< MenuProps, 'div', false >,
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
	} = useContextSystem< typeof props & Pick< MenuContextType, 'variant' > >(
		props,
		'Menu'
	);

	const parentContext = useContext( MenuContext );

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

	const menuStore = Ariakit.useMenuStore( {
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
		() => ( { store: menuStore, variant } ),
		[ menuStore, variant ]
	);

	// Extract the side from the applied placement — useful for animations.
	// Using `currentPlacement` instead of `placement` to make sure that we
	// use the final computed placement (including "flips" etc).
	const appliedPlacementSide = useStoreState(
		menuStore,
		'currentPlacement'
	).split( '-' )[ 0 ];

	if (
		menuStore.parent &&
		! ( isValidElement( trigger ) && MenuItem === trigger.type )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			'For nested Menus, the `trigger` should always be a `MenuItem`.'
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
				store={ menuStore }
				render={
					menuStore.parent
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
				store={ menuStore }
				// Root menu has an 8px distance from its trigger,
				// otherwise 0 (which causes the submenu to slightly overlap)
				gutter={ gutter ?? ( menuStore.parent ? 0 : 8 ) }
				// Align nested menu by the same (but opposite) amount
				// as the menu container's padding.
				shift={ shift ?? ( menuStore.parent ? -4 : 0 ) }
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
				<MenuContext.Provider value={ contextValue }>
					{ children }
				</MenuContext.Provider>
			</Ariakit.Menu>
		</>
	);
};

export const Menu = Object.assign( contextConnect( UnconnectedMenu, 'Menu' ), {
	Context: Object.assign( MenuContext, {
		displayName: 'Menu.Context',
	} ),
	Item: Object.assign( MenuItem, {
		displayName: 'Menu.Item',
	} ),
	RadioItem: Object.assign( MenuRadioItem, {
		displayName: 'Menu.RadioItem',
	} ),
	CheckboxItem: Object.assign( MenuCheckboxItem, {
		displayName: 'Menu.CheckboxItem',
	} ),
	Group: Object.assign( MenuGroup, {
		displayName: 'Menu.Group',
	} ),
	GroupLabel: Object.assign( MenuGroupLabel, {
		displayName: 'Menu.GroupLabel',
	} ),
	Separator: Object.assign( MenuSeparator, {
		displayName: 'Menu.Separator',
	} ),
	ItemLabel: Object.assign( MenuItemLabel, {
		displayName: 'Menu.ItemLabel',
	} ),
	ItemHelpText: Object.assign( MenuItemHelpText, {
		displayName: 'Menu.ItemHelpText',
	} ),
} );

export default Menu;
