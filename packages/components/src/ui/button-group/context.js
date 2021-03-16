/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/** @type {import('./types').ButtonGroupContext} */
const defaultContext = {};

export const ButtonGroupContext = createContext( defaultContext );
export const useButtonGroupContext = () => useContext( ButtonGroupContext );
