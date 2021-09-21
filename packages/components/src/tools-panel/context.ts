/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ToolsPanelContext as ToolsPanelContextType } from './types';

const noop = () => undefined;

export const ToolsPanelContext = createContext< ToolsPanelContextType >( {
	registerPanelItem: noop,
	deregisterPanelItem: noop,
	flagItemCustomization: noop,
} );

export const useToolsPanelContext = () =>
	useContext< ToolsPanelContextType >( ToolsPanelContext );
