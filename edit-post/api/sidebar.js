import { deprecated } from '@wordpress/utils';

function __experimentalRegisterSidebar( name, settings ) {
	deprecated( '__experimentalRegisterSidebar', {
		alternative: 'wp.plugins.registerPlugin',
		version: '2.6',
	} );


}