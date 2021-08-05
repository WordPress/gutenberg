const toggleSubmenuOnClick = ( event ) => {
	const buttonToggle = event.target.closest( '[aria-expanded]' );
	const isSubmenuOpen = buttonToggle.getAttribute( 'aria-expanded' );

	if ( isSubmenuOpen === 'true' ) {
		buttonToggle.setAttribute( 'aria-expanded', 'false' );
	} else {
		buttonToggle.setAttribute( 'aria-expanded', 'true' );
	}
};

const dropdownButtons = document.querySelectorAll(
	'.wp-block-dropdown__toggle'
);

dropdownButtons.forEach( ( button ) => {
	button.addEventListener( 'click', toggleSubmenuOnClick );

	button.addEventListener( 'mouseenter', function ( event ) {
		event.target
			.closest( '[aria-expanded]' )
			.setAttribute( 'aria-expanded', 'true' );
	} );
	button.addEventListener( 'mouseleave', function ( event ) {
		event.target
			.closest( '[aria-expanded]' )
			.setAttribute( 'aria-expanded', 'false' );
	} );
} );
