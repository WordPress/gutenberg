/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

export const ToolsPanelContext = createContext( {} );
export const useToolsPanelContext = () => useContext( ToolsPanelContext );
