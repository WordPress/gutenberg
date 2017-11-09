describe( 'Focusing blocks', () => {
	before( () => {
		// cy.login();
		cy.newPost();
	} );

	it( 'Testing focus of paragraph', () => {
		cy.auditBlockFocus( 'Paragraph', () => {
			cy.focused().type( 'Paragraph' );
		} );
	} );

	it( 'Testing focus of image', () => {
		cy.auditBlockFocus( 'Image', () => {
			// cy.focused().type( 'Paragraph' );
		} );
	} );

	it( 'Testing focus of heading', () => {
		cy.auditBlockFocus( 'Heading', () => {
			cy.focused().type( 'Heading' );
		} );
	} );
} );
