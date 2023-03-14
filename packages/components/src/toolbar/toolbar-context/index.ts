/**
 * External dependencies
 */
import type { ToolbarStateReturn } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

const ToolbarContext = createContext< ToolbarStateReturn | undefined >(
	undefined
);

export default ToolbarContext;
