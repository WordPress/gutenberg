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
	menuItems: { default: {}, optional: {} },
	hasMenuItems: false,
	isResetting: false,
	shouldRenderPlaceholderItems: false,
	registerPanelItem: noop,
	deregisterPanelItem: noop,
	flagItemCustomization: noop,
	registerResetAllFilter: noop,
	deregisterResetAllFilter: noop,
	areAllOptionalControlsHidden: true,
} );

export const useToolsPanelContext = () =>
	useContext< ToolsPanelContextType >( ToolsPanelContext );
