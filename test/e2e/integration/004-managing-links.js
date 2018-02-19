describe( 'Managing links', () => {
	before( () => {
		cy.newPost();
	} );

	const fixedIsOn = 'button.is-selected:contains("Fix Toolbar to Top")';
	const fixedIsOff = 'button:contains("Fix Toolbar to Top"):not(".is-selected")';

	const setFixedToolbar = ( b ) => {
		cy.get( '.edit-post-ellipsis-menu button' ).click();

		cy.get( 'body' ).then( ( $body ) => {
			const candidate = b ? fixedIsOff : fixedIsOn;
			const toggleNeeded = $body.find( candidate );
			if ( toggleNeeded.length ) {
				return 'button:contains("Fix Toolbar to Top")';
			}

			return '.edit-post-ellipsis-menu button';
		} ).then( ( selector ) => {
			cy.log( ' selector " + selector ', selector );
			cy.get( selector ).click();
		} );
	};

	it( 'Pressing Left and Esc in Link Dialog in "Fixed to Toolbar" mode', () => {
		setFixedToolbar( true );

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
		setFixedToolbar( false );

		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

		cy.get( lastBlockSelector ).click();
		cy.focused().type( 'test' );

		// we need to trigger isTyping = false
		cy.get( lastBlockSelector ).trigger( 'mousemove', { clientX: 200, clientY: 300 } );
		cy.get( lastBlockSelector ).trigger( 'mousemove', { clientX: 250, clientY: 350 } );

		cy.get( 'button[aria-label="Link"]' ).click();

		// Typing "left" should not close the dialog
		cy.get( '.blocks-url-input input' ).type( '{leftarrow}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'be.visible' );

		// Escape should close the dialog still.
		cy.focused().type( '{esc}' );
		cy.get( '.blocks-format-toolbar__link-modal' ).should( 'not.exist' );
	} );
} );
