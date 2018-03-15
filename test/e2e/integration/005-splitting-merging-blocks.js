describe( 'Splitting and merging paragraph blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should split and merge paragraph blocks using Enter and Backspace', () => {
		// TODO: Test splitting blocks by using Enter.  Due to a current bug
		// with Cypress, the text caret does not move from the start of the
		// text while typing, which is necessary to navigate to the middle
		// of some text and type Enter to split it.

		// Insert two separate paragraph blocks to be merged
		cy.get( '.editor-default-block-appender' ).click();
		cy.focused().type( 'First' );
		cy.get( '.editor-default-block-appender' ).click();
		cy.focused().type( 'Second' );

		// Switch to Code Editor to check HTML Output
		cy.get( '.edit-post-more-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

		//Assertion to check for two paragraph blocks before merge
		cy.get( '.editor-post-text-editor' ).should( 'have.value', [
			'<!-- wp:paragraph -->',
			'<p>First</p>',
			'<!-- /wp:paragraph -->',
			'',
			'<!-- wp:paragraph -->',
			'<p>Second</p>',
			'<!-- /wp:paragraph -->',
		].join( '\n' ) );

		// Switch to Visual Editor to ccontinue testing
		cy.get( '.edit-post-more-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Visual Editor' ).click();

		cy.focused().type( '{backspace}' );

		// Switch to Code Editor to check HTML Output
		cy.get( '.edit-post-more-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

		//Assertion to check for one paragraph blocks after merge
		cy.get( '.editor-post-text-editor' ).should( 'have.value', [
			'<!-- wp:paragraph -->',
			'<p>FirstSecond</p>',
			'<!-- /wp:paragraph -->',
		].join( '\n' ) );
	} );
} );
