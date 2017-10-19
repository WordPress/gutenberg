describe( 'Hello Gutenberg', () => {
	before( () => {
		cy.login( Cypress.env( 'username' ), Cypress.env( 'password' ) );
	} );

	it( 'Should show the New Post Page in Gutenberg', () => {
		// Navigate to New Post
		cy.get( '.wp-menu-name' ).contains( 'Posts' ).click();
		cy.get( '.wp-submenu a' ).contains( 'Add New' ).click();

		// Assertions
		cy.url().should( 'include', 'post-new.php' );
		cy.get( '[placeholder="Add title"]' ).should( 'exist' );
		cy.get( '[value="Write your story"]' ).should( 'exist' );
	} );
} );
