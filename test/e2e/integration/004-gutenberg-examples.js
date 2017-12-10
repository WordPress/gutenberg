const conditionalDescribe = Cypress.env( 'EXAMPLES' ) ? describe : describe.skip;
conditionalDescribe( 'Example Blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should insert example blocks', () => {
		cy.get( '.editor-header [aria-label="Insert block"]' ).click();
		cy.get( '[placeholder="Search for a block"]' ).type( 'example' );
		cy.get( '.editor-inserter__block' ).contains( 'Example' ).click();

		cy.get( '.editor-header [aria-label="Insert block"]' ).click();
		cy.get( '[placeholder="Search for a block"]' ).type( 'Example: Basic (esnext)' );
		cy.get( '.editor-inserter__block' ).contains( 'Example: Basic (esnext)' ).click();

		// Switch to Text Mode to check HTML Output
		cy.get( '.editor-ellipsis-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

		// Assertions
		cy.get( '.editor-post-text-editor' )
			.should( 'contain', 'wp-block-gutenberg-examples-example-01-basic' )
			.should( 'contain', 'wp-block-gutenberg-examples-example-01-basic-esnext' );
	} );
} );
