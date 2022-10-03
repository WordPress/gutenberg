/**
 * Internal dependencies
 */
import wpx from './wpx';

wpx( {
	core: {
		navigation: {
			openMenu: ( { context } ) => {
				context.open = true;
				context.previousElementWithFocus =
					window.document.activeElement;
			},
			closeMenu: ( { context } ) => {
				context.open = false;
			},
			isMenuOpen: ( { context } ) => context.open,
			isMenuClosed: ( { context } ) => ! context.open,
			addFirstElementToContext: ( { context, ref } ) => {
				context.firstMenuElement = ref;
			},
			focusFirstElement: async ( { context, tick } ) => {
				if ( context.open ) {
					await tick(); // We need to wait until the DOM is updated.
					context.firstMenuElement.focus();
				}
			},
			focusLastFocusedElement: ( { context } ) => {
				if ( ! context.open && context.previousElementWithFocus )
					context.previousElementWithFocus.focus();
			},
		},
	},
} );
