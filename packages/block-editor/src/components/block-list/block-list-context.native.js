/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

const BLOCKS_LAYOUTS = {};

const Context = createContext( {
	scrollRef: null,
	blocksLayouts: {},
	updateBlocksLayouts: () => {},
} );
const { Provider, Consumer } = Context;

function updateBlocksLayouts( blockData ) {
	const { clientId, shouldRemove } = blockData;

	if ( clientId && shouldRemove ) {
		delete BLOCKS_LAYOUTS[ clientId ];
		return;
	}

	if ( clientId ) {
		const { rootClientId, width, height, x, y } = blockData;

		BLOCKS_LAYOUTS[ clientId ] = {
			clientId,
			rootClientId,
			width,
			height,
			x,
			y,
		};
	}
}

export {
	Provider as BlockListProvider,
	Consumer as BlockListConsumer,
	updateBlocksLayouts,
	BLOCKS_LAYOUTS as blocksLayouts,
};

export const useBlockListContext = () => {
	const blockListContext = useContext( Context );
	return blockListContext;
};
