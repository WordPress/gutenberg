/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import exportReusableBlock from './utils/export';
import ImportDropdown from './components/import-dropdown';

// Setup Export Links
document.body.addEventListener( 'click', ( event ) => {
	if ( ! event.target.classList.contains( 'wp-list-reusable-blocks__export' ) ) {
		return;
	}
	event.preventDefault();
	exportReusableBlock( event.target.dataset.id );
} );

// Setup Import Form
document.addEventListener( 'DOMContentLoaded', function() {
	const buttons = document.getElementsByClassName( 'page-title-action' );
	const button = buttons.item( 0 );
	if ( ! button ) {
		return;
	}

	const refreshAndShowNotice = () => {
		window.location = addQueryArgs( window.location.href, { action: 'import' } );
	};

	const container = document.createElement( 'div' );
	container.className = 'list-reusable-blocks__container';
	button.parentNode.insertBefore( container, button );
	render( <ImportDropdown onUpload={ refreshAndShowNotice } />, container );
} );
