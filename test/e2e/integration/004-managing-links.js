describe( 'Managing blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Switch to "Fixed to toolbar" mode', () => {
		cy.get( '.editor-ellipsis-menu button' ).click()

		cy.get( 'body' ).then( ( $body ) => {
			const unselected = $body.find( 'button:contains("Fix toolbar to block"):not(".is-selected")' );
			console.log('unselected', unselected);
			if ( unselected.length ) {
				console.log('found a non-selected button');
				return 'button:contains("Fix toolbar to block")';
			}

			return '.editor-ellipsis-menu button';
		} ).then( ( selector ) => {
			cy.log( ' selector " + selector ', selector );
			cy.get( selector ).click();
		}, ( err ) => {
			cy.log(' error ', err);
		} );

		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

		// Using the placeholder
		cy.get( '.editor-default-block-appender' ).click();

		cy.get( 'button[aria-label="Link"]' ).click();

		cy.focused().type( '{leftarrow}' );

		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'be.visible' );

	} );
} );
