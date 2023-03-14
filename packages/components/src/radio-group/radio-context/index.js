/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const RadioContext = createContext( {
	state: null,
	setState: () => {},
} );

export default RadioContext;
