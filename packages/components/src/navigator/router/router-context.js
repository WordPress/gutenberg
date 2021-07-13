/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const createNamedContext = ( name ) => {
	const context = createContext();
	context.displayName = name;

	return context;
};

const historyContext = createNamedContext( 'NavigatorRouterHistory' );

export default historyContext;
