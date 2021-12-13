/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const RadioContext = createContext( {
	value: null,
	setValue: () => {},
} );

export default RadioContext;
