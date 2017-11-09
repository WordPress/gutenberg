import './user-commands';
import './gutenberg-commands';
import './focus-commands';

Cypress.Cookies.defaults( {
	whitelist: /^wordpress_/,
} );
