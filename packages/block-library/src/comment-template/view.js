/**
 * External dependencies
 */
import Alpine from 'alpinejs';

const load = () => {
	window.Alpine = Alpine;
	Alpine.start();
};

window.addEventListener( 'load', load );
