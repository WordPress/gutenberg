/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/** @type {import('react').Context<import('./types').ControlGroupContext>} */
export const ControlGroupContext = createContext( {} );
export const useControlGroupContext = () => useContext( ControlGroupContext );
