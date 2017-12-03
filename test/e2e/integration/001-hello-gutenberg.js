describe( 'Hello Gutenberg', () => {
	before( () => {
		cy.newPost();
	} );

	it( 'Should show the New Post Page in Gutenberg', () => {
		// Assertions
		cy.url().should( 'include', 'post-new.php' );
		cy.get( '[placeholder="Add title"]' ).should( 'exist' );
	} );
} );
