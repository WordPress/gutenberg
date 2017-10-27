Cypress.Commands.add( 'newPost', () => {
	cy.visit( '/wp-admin/post-new.php' );
	cy.url().should( 'include', 'post-new.php' );
} );
