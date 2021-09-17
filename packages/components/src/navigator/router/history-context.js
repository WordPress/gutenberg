/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const createNamedContext = ( name ) => {
	const context = createContext();
	context.displayName = name;

	return context;
};

const context = createNamedContext( 'NavigatorRouter' );

export default context;
