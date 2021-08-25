//@ts-nocheck

/**
 * External dependencies
 */
import ReactDOM from 'react-dom';

/**
 * Internal dependencies
 */
import Confirm from './component';

/**
 * Helper function that turns the Confirm component into a self-contained
 * confirm dialog, callable from outside an existing React tree, mimicking
 * the native `confirm` API.
 *
 * @param message the confirm message
 * @return Promise<bool>
 */
const confirm = ( message: string ) => {
	const wrapper = document.body.appendChild(
		document.createElement( 'div' )
	);

	const dispose = () => {
		setTimeout( () => {
			ReactDOM.unmountComponentAtNode( wrapper );
			setTimeout( () => {
				if ( document.body.contains( wrapper ) ) {
					document.body.removeChild( wrapper );
				}
			} );
		}, 1000 );
	};

	return new Promise( ( resolve ) => {
		const confirmHandler = ( _ ) => resolve( true );
		const cancelHandler = ( _ ) => resolve( false );

		try {
			ReactDOM.render(
				<Confirm
					message={ message }
					onConfirm={ confirmHandler }
					onCancel={ cancelHandler }
				/>,
				wrapper
			);
		} catch ( e ) {
			throw e;
		}
	} ).then( ( result: boolean ) => {
		dispose();
		return result;
	} );
};

export { Confirm, confirm };
