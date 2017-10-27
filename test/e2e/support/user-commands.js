Cypress.Commands.add( 'login', ( username = Cypress.env( 'username' ), password = Cypress.env( 'password' ) ) => {
	// A best practice would be to avoid this in each test
	// and fake it by calling an API and setting a cookie
	// (not sure this is possible in WP)

	cy.visit( '/wp-admin' );
	cy.get( '#user_login' ).type( username );
	cy.get( '#user_pass' ).type( password );
	cy.get( '#wp-submit' ).click();
} );
