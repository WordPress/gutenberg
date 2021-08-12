/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { TPContext } from './types';

export const ToolsPanelContext = createContext< TPContext >( {} );
export const useToolsPanelContext = () => useContext( ToolsPanelContext );
