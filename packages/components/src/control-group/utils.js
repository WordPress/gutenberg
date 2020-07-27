/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ControlGroupContext = createContext( {} );
export const useControlGroupContext = () => useContext( ControlGroupContext );
