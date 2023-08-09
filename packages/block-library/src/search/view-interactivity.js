/**
 * WordPress dependencies
 */
import { store as wpStore } from '@wordpress/interactivity';

function toggleAriaLabel( element ) {
	if ( ! ( 'toggledAriaLabel' in element.dataset ) ) {
		throw new Error( 'Element lacks toggledAriaLabel in dataset.' );
	}

	const ariaLabel = element.dataset.toggledAriaLabel;
	element.dataset.toggledAriaLabel = element.ariaLabel;
	element.ariaLabel = ariaLabel;
}

function toggleSearch( { context, ref } ) {
	if ( context.core.search.isSearchCollapsed ) {
		context.core.search.isSearchCollapsed =
			! context.core.search.isSearchCollapsed;
		ref.type = 'submit';
		ref.ariaExpanded = 'true';
		ref.removeAttribute( 'aria-controls' );
		toggleAriaLabel( ref );
		// TODO: Focus on sibling input. (In Chrome seems to make it automatically)
	}
}

wpStore( {
	selectors: {
		core: {
			search: {
				ariaLabel: ( { state, context } ) => {
					const { ariaLabelCollapsed, ariaLabelExpanded } =
						state.core.search;
					return context.core.search.isSearchInputVisible
						? ariaLabelExpanded
						: ariaLabelCollapsed;
				},
				ariaControls: ( { context } ) => {
					return context.core.search.isSearchInputVisible
						? ''
						: context.core.search.inputId;
				},
				type: ( { context } ) => {
					return context.core.search.isSearchInputVisible
						? 'submit'
						: 'button';
				},
				tabindex: ( { context } ) => {
					return context.core.search.isSearchInputVisible
						? '0'
						: '-1';
				},
			},
		},
	},
	actions: {
		core: {
			search: {
				toggleSearch,
				openSearchInput: ( { context } ) => {
					if ( ! context.core.search.isSearchInputVisible ) {
						context.core.search.isSearchInputVisible = true;
					}
				},
				closeSearchInput: ( { context } ) => {
					if ( context.core.search.isSearchInputVisible ) {
						context.core.search.isSearchInputVisible = false;
					}
				},
				handleSearchKeydown: ( store ) => {
					const { actions, event } = store;
					// If Escape close the menu.
					if ( event?.key === 'Escape' ) {
						actions.core.search.closeSearchInput( store );
					}
				},
				handleSearchFocusout: ( store ) => {
					const { actions, event, ref } = store;
					// If focus is outside search form, and in the document, close menu
					// event.target === The element losing focus
					// event.relatedTarget === The element receiving focus (if any)
					// When focusout is outsite the document,
					// `window.document.activeElement` doesn't change.
					if (
						! ref.contains( event.relatedTarget ) &&
						event.target !== window.document.activeElement
					) {
						actions.core.search.closeSearchInput( store );
					}
				},
			},
		},
	},
} );
