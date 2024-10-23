/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import {
	useContext,
	useMemo,
	forwardRef,
	useCallback,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { DropdownMenuPopoverProps } from './types';
import * as Styled from './styles';
import { DropdownMenuContext } from './context';

export const DropdownMenuPopover = forwardRef<
	HTMLDivElement,
	WordPressComponentProps< DropdownMenuPopoverProps, 'div', false >
>( function DropdownMenuPopover(
	{ gutter, children, shift, modal = true, ...otherProps },
	ref
) {
	const dropdownMenuContext = useContext( DropdownMenuContext );

	if ( ! dropdownMenuContext?.store ) {
		throw new Error(
			'DropdownMenu.Popover can only be rendered inside a DropdownMenu component'
		);
	}

	// Extract the side from the applied placement — useful for animations.
	// Using `currentPlacement` instead of `placement` to make sure that we
	// use the final computed placement (including "flips" etc).
	const appliedPlacementSide = Ariakit.useStoreState(
		dropdownMenuContext.store,
		'currentPlacement'
	).split( '-' )[ 0 ];

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

	const computedDirection = Ariakit.useStoreState(
		dropdownMenuContext.store,
		'rtl'
	)
		? 'rtl'
		: 'ltr';

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
		<Ariakit.Menu
			{ ...otherProps }
			ref={ ref }
			modal={ modal }
			store={ dropdownMenuContext.store }
			// Root menu has an 8px distance from its trigger,
			// otherwise 0 (which causes the submenu to slightly overlap)
			gutter={ gutter ?? ( dropdownMenuContext.store.parent ? 0 : 8 ) }
			// Align nested menu by the same (but opposite) amount
			// as the menu container's padding.
			shift={ shift ?? ( dropdownMenuContext.store.parent ? -4 : 0 ) }
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
				<Styled.MenuPopoverOuterWrapper
					variant={ dropdownMenuContext.variant }
				>
					<Styled.MenuPopoverInnerWrapper { ...renderProps } />
				</Styled.MenuPopoverOuterWrapper>
			) }
		>
			{ children }
		</Ariakit.Menu>
	);
} );
