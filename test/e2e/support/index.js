import './user-commands';
import './gutenberg-commands';

Cypress.Cookies.defaults( {
	whitelist: /^wordpress_/,
} );
