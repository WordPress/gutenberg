describe( 'Managing blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Switch to "Fixed to toolbar" mode', () => {
		cy.get( '.editor-ellipsis-menu button' ).click()

		cy.get( 'body' ).then( ( $body ) => {
			const unselected = $body.find( 'button:contains("Fix toolbar to block"):not(".is-selected")' );
			if ( unselected.length ) {
				return 'button:contains("Fix toolbar to block")';
			}

			return '.editor-ellipsis-menu button';
		} ).then( ( selector ) => {
			cy.log( ' selector " + selector ', selector );
			cy.get( selector ).click();
		} );

		cy.get( '.editor-default-block-appender' ).click();

		cy.get( 'button[aria-label="Link"]' ).click();

		cy.focused().type( '{leftarrow}' );

		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'be.visible' );
	} );
} );
