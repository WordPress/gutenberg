/**
 * External dependencies
 */
import MicroModal from 'micromodal';

function navigationToggleModal() {
	const toggleClass = ( el, className ) => el.classList.toggle( className );
	toggleClass( document.querySelector( 'html' ), 'has-modal-open' );
}

MicroModal.init( {
	onShow: () => navigationToggleModal(),
	onClose: () => navigationToggleModal(),
	openClass: 'is-menu-open',
} );
