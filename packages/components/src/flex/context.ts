/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const FlexContext = createContext< {
	flexItemDisplay: 'block' | undefined;
} >( {
	flexItemDisplay: undefined,
} );

export const useFlexContext = () => useContext( FlexContext );
