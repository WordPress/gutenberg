describe( 'Focusing blocks', () => {
	before( () => {
		// cy.login();
		cy.newPost();
	} );

	it( 'Should insert content using the placeholder, the quick inserter, the regular inserter', () => {
		const lastBlockSelector = '.editor-visual-editor__block-edit:last [contenteditable="true"]:first';

		// // Using the placeholder
		// cy.get( '[value="Write your story"]' ).click();
		// cy.get( lastBlockSelector ).type( '* First Paragraph' );

		// // Using the quick inserter
		// cy.get( '.editor-visual-editor__inserter [aria-label="Insert Paragraph"]' ).click();
		// cy.get( lastBlockSelector ).type( '* Second Paragraph' ).type( '{esc}' );
		// cy.focused().should( 'contain', 'Second Paragraph' );




		// const focusTargets = [
		// 	{
		// 		block: 'Insert Paragraph',
		// 		action: () => {
		// 			cy.focused().type( '* Paragraph Block' )
		// 		},
		// 		target: null,
		// 	},
		// 	{
		// 		block: 'Insert Image',
		// 		action: () => { },
		// 		target: 'caption',
		// 	},
		// ];

		// cy.focused().type( '{uparrow}' );

		// cy.focused().should( 'contain', 'First Paragraph' );
		cy.auditBlockFocus( 'Insert Paragraph', () => {
			cy.focused().type( 'Paragraph' );
		} );


		// focusTargets.forEach( ( t ) => {
		// 	cy.get( '.editor-visual-editor__inserter [aria-label="' + t.block + '"]' ).click();

		// 	if ( t.target ) {
		// 		cy.focused().find( t.target ).should( 'contain', 'cat' );
		// 	}

		// 	cy.focused().then( ( preFocus ) => {

		// 		cy.focused().as( 'insideFocus' );

		// 		t.action();
		// 		cy.focused().type( '{esc} ');

		// 		cy.focused().then( ( outerFocus ) => {
		// 			expect( outerFocus ).to.have.class(  'editor-visual-editor__block-edit' );
		// 		} );

		// 		cy.focused().type( '{enter}' );
		// 		cy.focused().then( ( postFocus ) => {
		// 			assert.equal( postFocus.context, preFocus.context );
		// 		} )
		// 	} );
		// } );


		// cy.wait(100);
	} );
} );
