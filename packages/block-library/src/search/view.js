/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const isEmpty = ( obj ) =>
	[ Object, Array ].includes( ( obj || {} ).constructor ) &&
	! Object.entries( obj || {} ).length;

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
			*updateSearch() {
				const { ref } = getElement();
				const { value, name } = ref;

				// Don't navigate if the search didn't really change.
				if ( 's' === name && value === state.search ) {
					return;
				}

				const url = new URL( window.location );

				if ( 's' === name ) {
					state.search = value;
					if ( ! isEmpty( value ) ) {
						url.searchParams.set( 'instant-search', value );
					} else {
						url.searchParams.delete( 'instant-search' );
					}
				}

				const { actions: routerActions } = yield import(
					'@wordpress/interactivity-router'
				);

				routerActions.navigate(
					`${ window.location.pathname }${ url.search }`
				);
			},
		},
	},
	{ lock: true }
);
