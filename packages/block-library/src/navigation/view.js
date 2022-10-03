/**
 * Internal dependencies
 */
import wpx from './wpx';

wpx( {
	core: {
		navigation: {
			openMenu: ( { context: { navigation } } ) => {
				navigation.open = true;
				navigation.previousElementWithFocus =
					window.document.activeElement;
			},
			closeMenu: ( { context: { navigation } } ) => {
				navigation.open = false;
			},
			isMenuOpen: ( { context: { navigation } } ) => navigation.open,
			isMenuClosed: ( { context: { navigation } } ) => ! navigation.open,
			addFirstElementToContext: ( { context: { navigation }, ref } ) => {
				navigation.firstMenuElement = ref;
			},
			focusFirstElement: async ( { context: { navigation }, tick } ) => {
				if ( navigation.open ) {
					await tick(); // We need to wait until the DOM is updated.
					navigation.firstMenuElement.focus();
				}
			},
			focusLastFocusedElement: ( { context: { navigation } } ) => {
				if ( ! navigation.open && navigation.previousElementWithFocus )
					navigation.previousElementWithFocus.focus();
			},
		},
	},
} );
