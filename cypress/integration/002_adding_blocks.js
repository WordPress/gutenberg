describe( 'Adding blocks', () => {
	beforeEach( () => {
		cy.login( Cypress.env( 'username' ), Cypress.env( 'password' ) );
		cy.newPost();
	} );

	it( 'Should insert content using the placeholder, the quick inserter, the regular inserter', () => {
		// Using the placeholder
		cy.get( '[value="Write your story"]' ).click();
		cy.get( ':focus' ).type( 'First Paragraph' );

		// Using the quick inserter
		cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
		cy.get( ':focus' ).type( 'Second Paragraph' );

		// Using the slash command
		cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
		cy.get( ':focus' ).type( '/quote{enter}' );
		cy.get( ':focus' ).type( 'Quote block' );

		// Using the regular inserter
		cy.get( '.editor-visual-editor [aria-label="Insert block"]' ).click();
		cy.get( ':focus' ).type( 'code' );
		cy.get( '.editor-inserter__block' ).contains( 'Code' ).click();
		cy.get( '[placeholder="Write code…"]' ).type( 'Code block' );

		// Switch to Text Mode to check HTML Output
		cy.get( '.editor-mode-switcher [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Switch To Text Mode' ).click();

		// Assertions
		cy.get( '.editor-text-editor__textarea' )
			.should( 'contain', 'First Paragraph' )
			.should( 'contain', 'Second Paragraph' )
			.should( 'contain', 'Quote block' )
			.should( 'contain', 'Code block' );
	} );
} );
