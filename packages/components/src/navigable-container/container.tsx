/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useRef, useEffect, useCallback } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { focus } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import type { NavigableContainerProps } from './types';

const noop = () => {};
const MENU_ITEM_ROLES = [ 'menuitem', 'menuitemradio', 'menuitemcheckbox' ];

function cycleValue( value: number, total: number, offset: number ) {
	const nextValue = value + offset;
	if ( nextValue < 0 ) {
		return total + nextValue;
	} else if ( nextValue >= total ) {
		return nextValue - total;
	}

	return nextValue;
}

function UnforwardedNavigableContainer(
	{
		children,
		stopNavigationEvents,
		eventToOffset,
		onNavigate = noop,
		onKeyDown,
		cycle = true,
		onlyBrowserTabstops,
		...restProps
	}: NavigableContainerProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const containerRef = useRef< HTMLDivElement | null >( null );

	const getFocusableIndex = useCallback(
		( focusables: Element[], target: Element ) => {
			return focusables.indexOf( target );
		},
		[]
	);

	const getFocusableContext = useCallback(
		( target: Element ) => {
			if ( ! containerRef.current ) {
				return null;
			}

			const finder = onlyBrowserTabstops
				? focus.tabbable
				: focus.focusable;
			const focusables = finder.find( containerRef.current );

			const index = getFocusableIndex( focusables, target );
			if ( index > -1 && target ) {
				return { index, target, focusables };
			}
			return null;
		},
		[ onlyBrowserTabstops, getFocusableIndex ]
	);

	useEffect( () => {
		const container = containerRef.current;
		if ( ! container ) {
			return;
		}

		function handleKeyDown( event: KeyboardEvent ) {
			if ( onKeyDown ) {
				onKeyDown( event );
			}

			const offset = eventToOffset( event );

			// eventToOffset returns undefined if the event is not handled by the component.
			if ( offset !== undefined && stopNavigationEvents ) {
				// Prevents arrow key handlers bound to the document directly interfering.
				event.stopImmediatePropagation();

				// When navigating a collection of items, prevent scroll containers
				// from scrolling. The preventDefault also prevents Voiceover from
				// 'handling' the event, as voiceover will try to use arrow keys
				// for highlighting text.
				const targetRole = (
					event.target as HTMLDivElement | null
				 )?.getAttribute( 'role' );
				const targetHasMenuItemRole =
					!! targetRole && MENU_ITEM_ROLES.includes( targetRole );

				if ( targetHasMenuItemRole ) {
					event.preventDefault();
				}
			}

			if ( ! offset ) {
				return;
			}

			const activeElement = ( event.target as HTMLElement | null )
				?.ownerDocument?.activeElement;
			if ( ! activeElement ) {
				return;
			}

			const context = getFocusableContext( activeElement );
			if ( ! context ) {
				return;
			}

			const { index, focusables } = context;
			const nextIndex = cycle
				? cycleValue( index, focusables.length, offset )
				: index + offset;

			if ( nextIndex >= 0 && nextIndex < focusables.length ) {
				focusables[ nextIndex ].focus();
				onNavigate( nextIndex, focusables[ nextIndex ] as HTMLElement );

				// `preventDefault()` on tab to avoid having the browser move the focus
				// after this component has already moved it.
				if ( event.code === 'Tab' ) {
					event.preventDefault();
				}
			}
		}

		// We use DOM event listeners instead of React event listeners
		// because we want to catch events from the underlying DOM tree.
		// The React Tree can be different from the DOM tree when using
		// portals. Block Toolbars for instance are rendered in a separate
		// React Trees.
		container.addEventListener( 'keydown', handleKeyDown );
		return () => {
			container.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [
		onKeyDown,
		eventToOffset,
		stopNavigationEvents,
		cycle,
		onNavigate,
		getFocusableContext,
	] );

	const mergedRef = useMergeRefs( [ containerRef, ref ] );

	return (
		<div ref={ mergedRef } { ...restProps }>
			{ children }
		</div>
	);
}

const NavigableContainer = forwardRef( UnforwardedNavigableContainer );
NavigableContainer.displayName = 'NavigableContainer';

export default NavigableContainer;
