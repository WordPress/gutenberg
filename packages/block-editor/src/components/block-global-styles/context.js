/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

export const DEFAULT_BLOCK_GLOBAL_STYLES_CONTEXT = {
	base: {},
	user: {},
	merged: {},
	setBlockGlobalStyles: () => {},
};

const BlockGlobalStylesContext = createContext(
	DEFAULT_BLOCK_GLOBAL_STYLES_CONTEXT
);

export default BlockGlobalStylesContext;
