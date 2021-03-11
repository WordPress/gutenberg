/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * @type {import('react').Context<{ tooltip?: import('reakit').TooltipState }>}
 */
export const TooltipContext = createContext( {} );
export const useTooltipContext = () => useContext( TooltipContext );
