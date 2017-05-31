/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';

/**
 * Internal dependencies
 */
import './style.scss';
import AcceptDialog from './dialog';

export default function accept( message, callback, confirmButtonText, cancelButtonText ) {
	let wrapper = document.createElement( 'div' );
	wrapper.className = 'utils-accept__backdrop';
	document.body.appendChild( wrapper );

	function onClose( result ) {
		if ( wrapper ) {
			unmountComponentAtNode( wrapper );
			document.body.removeChild( wrapper );
			wrapper = null;
		}

		if ( callback ) {
			callback( result === 'accept' );
		}
	}

	render(
		<AcceptDialog
			message={ message }
			onClose={ onClose }
			confirmButtonText={ confirmButtonText }
			cancelButtonText={ cancelButtonText }
		/>,
		wrapper
	);
}
