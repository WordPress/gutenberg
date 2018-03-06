Cypress.Commands.add( 'newPost', () => {
	cy.visitAdmin( '/post-new.php' );
} );

Cypress.Commands.add( 'visitAdmin', ( adminPath ) => {
	cy.visit( '/wp-admin/' + adminPath ).location( 'pathname' ).then( ( path ) => {
		if ( path.endsWith( '/wp-login.php' ) ) {
			cy.login();
		}
	} );
} );
