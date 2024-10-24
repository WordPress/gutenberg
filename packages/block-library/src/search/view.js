/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/** @type {( () => void ) | null} */
let supersedePreviousSearch = null;

const { state, actions } = store(
	'core/search',
	{
		state: {
			get ariaLabel() {
				const {
					isSearchInputVisible,
					ariaLabelCollapsed,
					ariaLabelExpanded,
				} = getContext();
				return isSearchInputVisible
					? ariaLabelExpanded
					: ariaLabelCollapsed;
			},
			get ariaControls() {
				const { isSearchInputVisible, inputId } = getContext();
				return isSearchInputVisible ? null : inputId;
			},
			get type() {
				const { isSearchInputVisible } = getContext();
				return isSearchInputVisible ? 'submit' : 'button';
			},
			get tabindex() {
				const { isSearchInputVisible } = getContext();
				return isSearchInputVisible ? '0' : '-1';
			},
			get isSearchInputVisible() {
				const ctx = getContext();

				// `ctx.isSearchInputVisible` is a client-side-only context value, so
				// if it's not set, it means that it's an initial page load, so we need
				// to return the value of `ctx.isSearchInputInitiallyVisible`.
				if ( typeof ctx.isSearchInputVisible === 'undefined' ) {
					return ctx.isSearchInputInitiallyVisible;
				}
				return ctx.isSearchInputVisible;
			},
		},
		actions: {
			openSearchInput( event ) {
				if ( ! state.isSearchInputVisible ) {
					event.preventDefault();
					const ctx = getContext();
					ctx.isSearchInputVisible = true;
					const { ref } = getElement();
					ref.parentElement.querySelector( 'input' ).focus();
				}
			},
			closeSearchInput() {
				const ctx = getContext();
				ctx.isSearchInputVisible = false;
			},
			handleSearchKeydown( event ) {
				const { ref } = getElement();
				// If Escape close the menu.
				if ( event?.key === 'Escape' ) {
					actions.closeSearchInput();
					ref.querySelector( 'button' ).focus();
				}
			},
			handleSearchFocusout( event ) {
				const { ref } = getElement();
				// If focus is outside search form, and in the document, close menu
				// event.target === The element losing focus
				// event.relatedTarget === The element receiving focus (if any)
				// When focusout is outside the document,
				// `window.document.activeElement` doesn't change.
				if (
					! ref.contains( event.relatedTarget ) &&
					event.target !== window.document.activeElement
				) {
					actions.closeSearchInput();
				}
			},
			*updateSearch( e ) {
				const { value } = e.target;

				const ctx = getContext();

				// Don't navigate if the search didn't really change.
				if ( value === ctx.search ) {
					return;
				}

				ctx.search = value;

				// Debounce the search by 300ms to prevent multiple navigations.
				supersedePreviousSearch?.();
				const { promise, resolve, reject } = Promise.withResolvers();
				const timeout = setTimeout( resolve, 300 );
				supersedePreviousSearch = () => {
					clearTimeout( timeout );
					reject();
				};
				try {
					yield promise;
				} catch {
					return;
				}

				const url = new URL( window.location.href );
				url.searchParams.delete( 'paged' );

				if ( value ) {
					if ( ctx.isInherited ) {
						url.searchParams.set( 'instant-search', value );
					} else {
						// Set the instant-search parameter using the query ID and search value
						const queryId = ctx.queryId;
						url.searchParams.set(
							`instant-search-${ queryId }`,
							value
						);
					}
				} else {
					url.searchParams.delete( 'instant-search' );
					url.searchParams.delete(
						`instant-search-${ ctx.queryId }`
					);
				}

				const { actions: routerActions } = yield import(
					'@wordpress/interactivity-router'
				);

				routerActions.navigate( url.href );
			},
		},
	},
	{ lock: true }
);
