/**
 * External dependencies
 */
import { createProvider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from '../../store';

/**
 * Module constants
 */
const ReduxProvider = createProvider( 'core/nux' );

function Provider( props ) {
	return <ReduxProvider store={ store } { ...props } />;
}

export default Provider;
