/**
 * External dependencies
 */
import type { ToolbarStore } from '@ariakit/react/toolbar';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const ToolbarContext = createContext< ToolbarStore | undefined >( undefined );

export default ToolbarContext;
