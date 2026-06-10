import { createContext } from '@wordpress/element';
import type { TooltipInternalContext as TooltipInternalContextType } from './types';

export const TooltipInternalContext =
	createContext< TooltipInternalContextType >( {
		isNestedInTooltip: false,
	} );
TooltipInternalContext.displayName = 'TooltipInternalContext';
