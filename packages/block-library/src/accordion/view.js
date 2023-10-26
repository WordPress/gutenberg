function toggleHandler( event ) {
	// Bail early if the accordion is not open
	if ( ! event.target.hasAttribute( 'open' ) ) {
		return;
	}

	// Bail early if the parent is not an accordion block.
	const parent = event.target.closest( '.wp-block-accordion' );
	if ( ! parent ) {
		return;
	}

	// Get all open accordions inside parent,
	// and close any that aren't the current accordion.
	const opened = parent.querySelectorAll( 'details[open]' );
	for ( const accordion of opened ) {
		if ( accordion === event.target ) continue;
		accordion.removeAttribute( 'open' );
	}
}

document.addEventListener( 'toggle', toggleHandler, true );
