Cypress.Commands.add( 'newPost', () => {
	cy.visit( '/wp-admin/post-new.php' );
} );
