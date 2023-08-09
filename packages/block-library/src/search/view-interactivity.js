/**
 * WordPress dependencies
 */
import { store as wpStore } from '@wordpress/interactivity';

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
