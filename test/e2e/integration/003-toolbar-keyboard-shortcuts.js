describe( 'Navigationg to/from the toolbar using keeyboard shortcuts', () => {
	before( () => {
		cy.login();
		cy.newPost();
	} );

	it( 'Should insert content using the placeholder, the quick inserter, the regular inserter', () => {
		// Using the placeholder
		cy.get( '[value="Write your story"]' ).click();
		cy.focused().type( '{alt}{fn}' );
	} );
} );
