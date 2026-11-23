import type { RefObject } from 'react';
import { useRefEffect } from '@wordpress/compose';
import { useCallback, useLayoutEffect, useRef } from '@wordpress/element';

const FOCUSABLE_SELECTOR =
	'button, input, select, textarea, a[href], [tabindex]';

// Items of a composite grid (the list and grid layouts) take turns being
// tabbable, so none may be right after the one that was removed.
const ROVING_ITEM_SELECTOR = '[role="grid"] [tabindex="-1"][id]';

const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';

function isAvailable( element: HTMLElement ) {
	return (
		! element.hasAttribute( 'disabled' ) &&
		element.getAttribute( 'aria-disabled' ) !== 'true' &&
		! element.closest( '[inert]' ) &&
		element.getClientRects().length > 0
	);
}

function getTabbables( root: HTMLElement ) {
	return Array.from(
		root.querySelectorAll< HTMLElement >( FOCUSABLE_SELECTOR )
	).filter( ( element ) => element.tabIndex >= 0 && isAvailable( element ) );
}

function getRovingItem( root: HTMLElement ) {
	return Array.from(
		root.querySelectorAll< HTMLElement >( ROVING_ITEM_SELECTOR )
	).find( isAvailable );
}

function isCheckbox( element: HTMLElement ) {
	return (
		( element as HTMLInputElement ).type === 'checkbox' ||
		element.getAttribute( 'role' ) === 'checkbox'
	);
}

// Whether focus is on what the action still holds: its dialog or menu, or
// its busy button in the bulk actions toolbar.
function isHeldByAction( element: Element ) {
	return !! element.closest(
		`${ DIALOG_SELECTOR }, [role="menu"], [data-dataviews-busy]`
	);
}

function isFocusLost( ownerDocument: Document ) {
	const { activeElement, body } = ownerDocument;
	return ! activeElement || activeElement === body;
}

/**
 * Keeps focus in the view when an action removes the control that had it,
 * e.g. moving items to the trash removes their rows, along with the action
 * buttons and any dialog rendered from them. Focus would otherwise fall back
 * to the document body.
 *
 * Like the bulk actions focus, this only acts on request: running an action
 * asks for it, and the request stands until items are removed or the user
 * moves focus elsewhere. Once items are gone and the view is done loading (the
 * layouts are inert while loading), if focus is lost, it moves to the "Select
 * all" checkbox, or else the first control or item of the layout, or else the
 * first control of the view, such as the search when no items are left. The
 * list then moves it on to the item that followed the removed one.
 *
 * Some actions remove the items before they end, while focus is still on
 * their dialog or busy button. Focus is then lost only once that goes, which
 * may be without a render of the view, e.g. when the bulk actions toolbar
 * goes too. So until focus lands somewhere, the document is watched for it.
 *
 * @param options           Options.
 * @param options.layoutRef The element wrapping the layout.
 * @param options.data      The items shown.
 * @param options.getItemId Returns the ID of an item.
 * @param options.isLoading Whether the items are loading.
 *
 * @return A ref for the element wrapping the whole view, and a function that
 *         asks to keep focus in the view after an action.
 */
export default function useFocusAfterAction< Item >( {
	layoutRef,
	data,
	getItemId,
	isLoading,
}: {
	layoutRef: RefObject< HTMLElement | null >;
	data: Item[];
	getItemId: ( item: Item ) => string;
	isLoading?: boolean;
} ) {
	const wrapperRef = useRef< HTMLElement | null >( null );
	// The IDs of the items shown when the action ran.
	const requestedIdsRef = useRef< Set< string > | null >( null );
	const isLoadingRef = useRef( isLoading );
	// Watches for focus to be lost once the items went while it was still on
	// a control, until it lands somewhere.
	const observerRef = useRef< MutationObserver | null >( null );

	const stopWaiting = useCallback( () => {
		observerRef.current?.disconnect();
		observerRef.current = null;
	}, [] );

	const moveFocus = useCallback( () => {
		const wrapper = wrapperRef.current;
		if ( ! wrapper || ! isFocusLost( wrapper.ownerDocument ) ) {
			return;
		}
		const layout = layoutRef.current;
		const layoutControls = layout ? getTabbables( layout ) : [];
		const target =
			layoutControls.find( isCheckbox ) ??
			layoutControls[ 0 ] ??
			( layout && getRovingItem( layout ) ) ??
			getTabbables( wrapper )[ 0 ];
		target?.focus();
	}, [ layoutRef ] );

	// Moves focus if it's lost and the view is done loading. Keeps waiting
	// while the action still holds focus, and stops once focus is elsewhere.
	const settle = useCallback( () => {
		const wrapper = wrapperRef.current;
		if ( ! wrapper ) {
			return;
		}
		const { activeElement } = wrapper.ownerDocument;
		if ( ! isFocusLost( wrapper.ownerDocument ) ) {
			if ( activeElement && ! isHeldByAction( activeElement ) ) {
				stopWaiting();
			}
			return;
		}
		if ( isLoadingRef.current ) {
			return;
		}
		stopWaiting();
		moveFocus();
	}, [ moveFocus, stopWaiting ] );

	const ref = useRefEffect(
		( wrapper: HTMLElement ) => {
			wrapperRef.current = wrapper;
			const { ownerDocument } = wrapper;
			const onFocusIn = ( event: FocusEvent ) => {
				const target = event.target as Element;
				// Focus landed somewhere once the action ended.
				if ( target instanceof Element && ! isHeldByAction( target ) ) {
					stopWaiting();
				}
				// The request stands while focus is in the view, or in a
				// dialog or menu the action opened.
				if (
					wrapper.contains( target ) ||
					target.closest?.( `${ DIALOG_SELECTOR }, [role="menu"]` )
				) {
					return;
				}
				requestedIdsRef.current = null;
			};
			ownerDocument.addEventListener( 'focusin', onFocusIn );
			return () => {
				ownerDocument.removeEventListener( 'focusin', onFocusIn );
				stopWaiting();
				wrapperRef.current = null;
			};
		},
		[ stopWaiting ]
	);

	// Layout effects run before the effects of ancestors, such as a router
	// that moves focus when a navigation removes the focused element.
	useLayoutEffect( () => {
		isLoadingRef.current = isLoading;
		const wrapper = wrapperRef.current;
		if ( ! wrapper || isLoading ) {
			return;
		}
		if ( observerRef.current ) {
			settle();
			return;
		}
		const requestedIds = requestedIdsRef.current;
		if ( ! requestedIds ) {
			return;
		}
		const ids = new Set( data.map( getItemId ) );
		if ( ! [ ...requestedIds ].some( ( id ) => ! ids.has( id ) ) ) {
			return;
		}
		requestedIdsRef.current = null;
		if ( isFocusLost( wrapper.ownerDocument ) ) {
			moveFocus();
			return;
		}
		const { ownerDocument } = wrapper;
		const observer = new MutationObserver( settle );
		observer.observe( ownerDocument.body, {
			childList: true,
			subtree: true,
		} );
		observerRef.current = observer;
		settle();
	}, [ data, getItemId, isLoading, moveFocus, settle ] );

	const request = useCallback( () => {
		stopWaiting();
		requestedIdsRef.current = new Set( data.map( getItemId ) );
	}, [ data, getItemId, stopWaiting ] );

	return { ref, request };
}
