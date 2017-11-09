Cypress.Commands.add( 'newPost', () => {
	console.log('here');
	cy.visitAdmin( '/post-new.php' );
} );

Cypress.Commands.add( 'visitAdmin', ( adminPath ) => {
	cy.visit( '/wp-admin/' + adminPath ).location( 'pathname' ).then( ( path ) => {
		if ( path === '/wp-login.php' ) {
			cy.login();
		}
	} );
} );
