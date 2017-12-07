describe( 'Managing links', () => {
	before( () => {
		cy.newPost();
	} );

	const fixedIsOn = 'button.is-selected:contains("Fix toolbar to block")';
	const fixedIsOff = 'button:contains("Fix toolbar to block"):not(".is-selected")';

	const switchToMode = ( setFixed ) => {
		cy.get( '.editor-ellipsis-menu button' ).click();

		cy.get( 'body' ).then( ( $body ) => {
			const candidate = setFixed ? fixedIsOff : fixedIsOn;
			const toggleNeeded = $body.find( candidate );
			if ( toggleNeeded.length ) {
				return 'button:contains("Fix toolbar to block")';
			}

			return '.editor-ellipsis-menu button';
		} ).then( ( selector ) => {
			cy.log( ' selector " + selector ', selector );
			cy.get( selector ).click();
		} );
	};

	it( 'Pressing Left and Esc in Link Dialog in "Fixed to Toolbar" mode', () => {
		switchToMode( true );

		cy.get( '.editor-default-block-appender' ).click();

		cy.get( 'button[aria-label="Link"]' ).click();

		// Typing "left" should not close the dialog
		cy.focused().type( '{leftarrow}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'be.visible' );

		// Escape should close the dialog still.
		cy.focused().type( '{esc}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'not.exist' );
	} );

	it( 'Pressing Left and Esc in Link Dialog in "Docked Toolbar" mode', () => {
		switchToMode( false );

		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

		cy.get( lastBlockSelector ).click();

		cy.get( 'button[aria-label="Link"]' ).click();

		// Typing "left" should not close the dialog
		cy.focused().type( '{leftarrow}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'be.visible' );

		// Escape should close the dialog still.
		cy.focused().type( '{esc}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'not.exist' );
	} );
} );
