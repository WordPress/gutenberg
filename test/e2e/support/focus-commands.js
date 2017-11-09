Cypress.Commands.add( 'auditBlockFocus', ( blockType, setupBlock = () => { } ) => {
	cy.get( '.editor-visual-editor__inserter [aria-label="' + blockType + '"]' ).click();

	cy.focused().then( ( preFocus ) => {
		cy.wrap( preFocus ).closest( '.editor-visual-editor__block-edit' ).then( ( outer ) => {
			assert.notEqual( outer.get( 0 ), preFocus.get( 0 ) );
		} );

		setupBlock();

		cy.focused().type( '{esc} ');

		cy.focused().then( ( outerFocus ) => {
			expect( outerFocus ).to.have.class(  'editor-visual-editor__block-edit' );
		} );

		cy.focused().type( '{enter}' );
		cy.focused().then( ( postFocus ) => {
			assert.equal( postFocus.get( 0 ), preFocus.get( 0 ) );
		} );
	} );
} );
