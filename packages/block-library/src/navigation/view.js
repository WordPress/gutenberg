/*eslint-env browser*/
// Open on click functionality.

/**
 * Keep track of whether a submenu is open to short-circuit delegated event listeners.
 *
 * TODO: What if there are multiple nav menus? Can multiple submenus be expanded at once from separate Navigation blocks?
 *
 * @type {boolean}
 */
let hasOpenSubmenu = false;

/**
 * Close submenu items for a navigation item.
 *
 * @param {HTMLElement} navigationItem - Either a NAV or LI element.
 */
function closeSubmenus( navigationItem ) {
	navigationItem
		.querySelectorAll( '[aria-expanded="true"]' )
		.forEach( function ( toggle ) {
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
	hasOpenSubmenu = false;
}

/**
 * Toggle submenu on click.
 *
 * @param {HTMLButtonElement} buttonToggle
 */
function toggleSubmenuOnClick( buttonToggle ) {
	const isSubmenuOpen = buttonToggle.getAttribute( 'aria-expanded' );
	const navigationItem = buttonToggle.closest( '.wp-block-navigation-item' );

	if ( isSubmenuOpen === 'true' ) {
		closeSubmenus( navigationItem );
	} else {
		// Close all sibling submenus.
		const navigationParent = buttonToggle.closest(
			'.wp-block-navigation__submenu-container, .wp-block-navigation__container, .wp-block-page-list'
		);
		navigationParent
			.querySelectorAll( '.wp-block-navigation-item' )
			.forEach( function ( child ) {
				if ( child !== navigationItem ) {
					closeSubmenus( child );
				}
			} );
		// Open submenu.
		buttonToggle.setAttribute( 'aria-expanded', 'true' );
		hasOpenSubmenu = true;
	}
}

// Open on button click or close on click outside.
document.addEventListener(
	'click',
	function ( event ) {
		const target = event.target;
		if ( ! ( target instanceof Element ) ) {
			return;
		}

		const button = target.closest( '.wp-block-navigation-submenu__toggle' );
		if ( button instanceof HTMLButtonElement ) {
			toggleSubmenuOnClick( button );
		}

		// Close any other open submenus.
		if ( hasOpenSubmenu ) {
			const navigationBlocks = document.querySelectorAll(
				'.wp-block-navigation'
			);
			navigationBlocks.forEach( function ( block ) {
				if ( ! block.contains( event.target ) ) {
					closeSubmenus( block );
				}
			} );
		}
	},
	{ passive: true }
);

// Close on focus outside or escape key.
document.addEventListener(
	'keyup',
	function ( event ) {
		// Abort if there aren't any submenus open anyway.
		if ( ! hasOpenSubmenu ) {
			return;
		}

		const submenuBlocks = document.querySelectorAll(
			'.wp-block-navigation-item.has-child'
		);
		submenuBlocks.forEach( function ( block ) {
			if ( ! block.contains( event.target ) ) {
				closeSubmenus( block );
			} else if ( event.key === 'Escape' ) {
				const toggle = block.querySelector( '[aria-expanded="true"]' );
				closeSubmenus( block );
				// Focus the submenu trigger so focus does not get trapped in the closed submenu.
				toggle?.focus();
			}
		} );
	},
	{ passive: true }
);
