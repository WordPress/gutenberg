import type * as Ariakit from '@ariakit/react';
import { useCallback } from '@wordpress/element';

function focusDisclosureElement( disclosureElement: HTMLElement ) {
	disclosureElement.focus();

	if ( disclosureElement.ownerDocument.activeElement === disclosureElement ) {
		return;
	}

	// A modal Ariakit menu disables the document tree outside the menu. Modern
	// browsers use `inert`; Ariakit's fallback replaces each element's `focus`
	// method. Ariakit restores either mechanism as soon as the menu hides.
	const inertAncestor = disclosureElement.closest< HTMLElement >( '[inert]' );
	if ( inertAncestor ) {
		inertAncestor.inert = false;
	}

	disclosureElement.ownerDocument.defaultView?.HTMLElement.prototype.focus.call(
		disclosureElement
	);
}

export function useMenuItemHideOnClick(
	store: Ariakit.MenuItemProps[ 'store' ],
	hideOnClick: Ariakit.MenuItemProps[ 'hideOnClick' ]
) {
	return useCallback(
		( event: React.MouseEvent< HTMLElement > ) => {
			const shouldHide =
				typeof hideOnClick === 'function'
					? hideOnClick( event )
					: hideOnClick;

			if ( ! shouldHide ) {
				return false;
			}

			if ( ! store || ! ( 'hideAll' in store ) ) {
				return true;
			}

			const menuElement = store.getState().contentElement;
			const activeElement = menuElement?.ownerDocument.activeElement;

			if ( menuElement?.contains( activeElement ?? null ) ) {
				let rootStore = store;
				while ( rootStore.parent ) {
					rootStore = rootStore.parent;
				}

				const disclosureElement =
					rootStore.getState().disclosureElement;

				// Ariakit calls this immediately before it hides and unmounts the
				// menu. Move focus first so an overlay opened by the item's onClick
				// captures the root trigger as its focus return target.
				if ( disclosureElement ) {
					focusDisclosureElement( disclosureElement );
				}
			}

			return true;
		},
		[ hideOnClick, store ]
	);
}
