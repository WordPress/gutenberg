import {
	store,
	getContext,
	getElement,
	withSyncEvent,
} from '@wordpress/interactivity';

const getBackgroundColor = ( element ) => {
	while ( element ) {
		const { backgroundColor } = window.getComputedStyle( element );
		if (
			backgroundColor !== 'transparent' &&
			backgroundColor !== 'rgba(0, 0, 0, 0)'
		) {
			return backgroundColor;
		}
		element = element.parentElement;
	}
	return 'Canvas';
};

const updateMobileOverlay = ( search, context ) => {
	const overlay = search.querySelector( '.wp-block-search__mobile-overlay' );
	if ( window.getComputedStyle( overlay ).position !== 'absolute' ) {
		return;
	}
	const wrapper = overlay.parentElement;
	context.mobileOverlayLeft = `${
		-wrapper.getBoundingClientRect().left - wrapper.clientLeft
	}px`;
	context.mobileOverlayBackgroundColor = getBackgroundColor( wrapper );
};

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
					updateMobileOverlay(
						ref.closest( '.wp-block-search' ),
						ctx
					);
					ctx.isSearchInputVisible = true;
					ref.parentElement.querySelector( 'input' ).focus();
				}
			} ),
			closeSearchInput() {
				const ctx = getContext();
				ctx.isSearchInputVisible = false;
			},
			handleSearchKeydown: withSyncEvent( function* ( event ) {
				const { ref } = getElement();
				// If Escape close the menu.
				if ( event?.key === 'Escape' ) {
					actions.closeSearchInput();
					// Make sure the button is visible before focusing it.
					yield new Promise( window.requestAnimationFrame );
					ref.querySelector(
						'.wp-block-search__inside-wrapper > button'
					).focus();
				}
			} ),
			handleSearchFocusout: withSyncEvent( ( event ) => {
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
					// A breakpoint change can hide the focused button. Keep focus
					// in the open search instead of treating this as leaving it.
					if (
						getContext().isSearchInputVisible &&
						! event.relatedTarget &&
						( ! event.target.getClientRects().length ||
							window.getComputedStyle( event.target )
								.visibility === 'hidden' )
					) {
						const input = ref.querySelector( 'input' );
						input.focus();
						if ( ref.ownerDocument.activeElement === input ) {
							return;
						}
					}
					actions.closeSearchInput();
				}
			} ),
		},
		callbacks: {
			resizeSearch() {
				const { ref } = getElement();
				const context = getContext();
				if ( context.isSearchInputVisible ) {
					updateMobileOverlay( ref, context );
				}
			},
		},
	},
	{ lock: true }
);
