/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

/** @type {( () => void ) | null} */
let supersedePreviousSearch = null;

const { actions } = store(
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
		},
		actions: {
			openSearchInput: withSyncEvent( ( event ) => {
				const ctx = getContext();
				const { ref } = getElement();
				if ( ! ctx.isSearchInputVisible ) {
					event.preventDefault();
					ctx.isSearchInputVisible = true;
					ref.parentElement.querySelector( 'input' ).focus();
				}
			} ),
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

				const promise = new Promise( ( resolve, reject ) => {
					const timeout = setTimeout( resolve, 300 );
					supersedePreviousSearch = () => {
						clearTimeout( timeout );
						reject( new Error( 'Search superseded' ) );
					};
				} );

				try {
					yield promise;
				} catch ( error ) {
					// Search was superseded by a newer search, exit early
					return;
				}

				const url = new URL( window.location.href );

				if ( value ) {
					// Set the instant-search parameter using the query ID and search value
					const queryId = ctx.queryId;
					url.searchParams.set(
						`instant-search-${ queryId }`,
						value
					);

					// Make sure we reset the pagination.
					url.searchParams.set( `query-${ queryId }-page`, '1' );
				} else {
					// Reset specific search for non-inherited queries
					url.searchParams.delete(
						`instant-search-${ ctx.queryId }`
					);
					url.searchParams.delete( `query-${ ctx.queryId }-page` );
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
