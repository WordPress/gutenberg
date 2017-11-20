describe( 'Adding blocks', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should insert content using the placeholder, the quick inserter, the regular inserter', () => {
		const lastBlockSelector = '.editor-block-list__block-edit:last [contenteditable="true"]:first';

		// Using the placeholder
		cy.get( '[value="Write your story"]' ).click();
		cy.get( lastBlockSelector ).type( 'First Paragraph' );

		// Using the quick inserter
		cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
		cy.get( lastBlockSelector ).type( 'Second Paragraph' );

		// Using the slash command
		cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
		cy.get( lastBlockSelector ).type( '/quote{enter}' );
		cy.get( lastBlockSelector ).type( 'Quote block' );

		// Using the regular inserter
		cy.get( '.editor-visual-editor [aria-label="Insert block"]' ).click();
		cy.get( '[placeholder="Search for a block"]' ).type( 'code' );
		cy.get( '.editor-inserter__block' ).contains( 'Code' ).click();
		cy.get( '[placeholder="Write code…"]' ).type( 'Code block' );

		// Switch to Text Mode to check HTML Output
		cy.get( '.editor-ellipsis-menu [aria-label="More"]' ).click();
		cy.get( 'button' ).contains( 'Code Editor' ).click();

		// Assertions
		cy.get( '.editor-post-text-editor' )
			.should( 'contain', 'First Paragraph' )
			.should( 'contain', 'Second Paragraph' )
			.should( 'contain', 'Quote block' )
			.should( 'contain', 'Code block' );
	} );
} );
