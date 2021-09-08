const closeSubmenus = ( element ) => {
	element
		.querySelectorAll( '[aria-expanded="true"]' )
		.forEach( ( toggle ) => {
			toggle.setAttribute( 'aria-expanded', 'false' );
		} );
};

const toggleSubmenuOnClick = ( event ) => {
	const buttonToggle = event.target.closest( '[aria-expanded]' );
	const isSubmenuOpen = buttonToggle.getAttribute( 'aria-expanded' );

	if ( isSubmenuOpen === 'true' ) {
		closeSubmenus( buttonToggle.closest( '.wp-block-navigation-submenu' ) );
	} else {
		// Close all sibling submenus.
		const parentElement = buttonToggle.closest(
			'.wp-block-navigation-submenu'
		);
		const parentList =
			buttonToggle.closest( '.wp-block-navigation__submenu-container' ) ||
			buttonToggle.closest( '.wp-block-navigation__container' );
		Array.from( parentList.children ).forEach( ( child ) => {
			if ( child !== parentElement ) {
				closeSubmenus( child );
			}
		} );
		// Open submenu.
		buttonToggle.setAttribute( 'aria-expanded', 'true' );
	}
};

const submenuButtons = document.querySelectorAll(
	'.wp-block-navigation-submenu__toggle'
);

submenuButtons.forEach( ( button ) => {
	button.addEventListener( 'click', toggleSubmenuOnClick );
} );

// Close on click outside.
document.addEventListener( 'click', function ( event ) {
	const navigationBlocks = document.querySelectorAll(
		'.wp-block-navigation'
	);
	navigationBlocks.forEach( ( block ) => {
		if ( ! block.contains( event.target ) ) {
			closeSubmenus( block );
		}
	} );
} );
// Close on focus outside.
document.addEventListener( 'keyup', function ( event ) {
	const submenuBlocks = document.querySelectorAll(
		'.wp-block-navigation-submenu'
	);
	submenuBlocks.forEach( ( block ) => {
		if ( ! block.contains( event.target ) ) {
			closeSubmenus( block );
		}
	} );
} );
