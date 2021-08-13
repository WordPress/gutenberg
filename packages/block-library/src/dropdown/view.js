const closeSubmenus = ( element ) => {
	if ( element.getAttribute( 'aria-expanded' ) === 'true' ) {
		element.setAttribute( 'aria-expanded', 'false' );
	}
	element.querySelectorAll( '[aria-expanded="true"]' ).forEach( ( child ) => {
		closeSubmenus( child );
	} );
};

const toggleSubmenuOnClick = ( event ) => {
	const buttonToggle = event.target.closest( '[aria-expanded]' );
	const isSubmenuOpen = buttonToggle.getAttribute( 'aria-expanded' );

	if ( isSubmenuOpen === 'true' ) {
		closeSubmenus( buttonToggle );
	} else {
		// Close all sibling submenus.
		const parentElement = buttonToggle.closest(
			'.wp-block-navigation-item'
		);
		const parentList =
			buttonToggle.closest( '.wp-block-dropdown__container' ) ||
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

const dropdownButtons = document.querySelectorAll(
	'.wp-block-dropdown__toggle'
);

dropdownButtons.forEach( ( button ) => {
	button.addEventListener( 'click', toggleSubmenuOnClick );
} );

// Close on click outside.
/* eslint-disable @wordpress/no-global-event-listener */
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
/* eslint-enable @wordpress/no-global-event-listener */
