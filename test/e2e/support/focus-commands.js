Cypress.Commands.add( 'auditBlockFocus', ( blockType ) => {
	// Open up the Insert Block Menu
	cy.get( 'button.editor-inserter__toggle:first' ).click()
	// Type into the Search field for blocks
	cy.focused().type( blockType );
	// Click on the first result that matches. Note, be careful with things like Image vs Cover Image
	cy.get( '.editor-inserter__menu .editor-inserter__block:contains("' + blockType + '"):first' ).click();

	// Identify the item that has focus immediately after block creation
	cy.focused().then( ( preFocus ) => {
		// Ensure that the immediately focused item is not the outer block
		cy.wrap( preFocus ).closest( '.editor-visual-editor__block-edit' ).then( ( outer ) => {
			assert.notEqual( outer.get( 0 ), preFocus.get( 0 ) );
		} );

		// Press ESC to focus the outer block
		cy.wait(500);
		cy.focused().type( '{esc} ');

		// Ensure that the outer block is now focused
		cy.focused().then( ( outerFocus ) => {
			expect( outerFocus ).to.have.class(  'editor-visual-editor__block-edit' );
		} );

		cy.wait(500);
		// Press ENTER to go inside the block again
		cy.focused().type( '{enter}' );

		// Ensure that the focused item now matches the item that received focus initially after creating
		cy.focused().then( ( postFocus ) => {
			assert.equal( postFocus.get( 0 ), preFocus.get( 0 ) );
		} );
	} );
} );
