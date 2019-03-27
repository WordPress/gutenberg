/**
 * Internal dependencies
 */
import {
	fetchReusableBlocks,
	saveReusableBlocks,
	deleteReusableBlocks,
	convertBlockToReusable,
	convertBlockToStatic,
	receiveReusableBlocks,
} from './effects/reusable-blocks';

export default {
	FETCH_REUSABLE_BLOCKS: ( action, store ) => {
		fetchReusableBlocks( action, store );
	},
	SAVE_REUSABLE_BLOCK: ( action, store ) => {
		saveReusableBlocks( action, store );
	},
	DELETE_REUSABLE_BLOCK: ( action, store ) => {
		deleteReusableBlocks( action, store );
	},
	RECEIVE_REUSABLE_BLOCKS: receiveReusableBlocks,
	CONVERT_BLOCK_TO_STATIC: convertBlockToStatic,
	CONVERT_BLOCK_TO_REUSABLE: convertBlockToReusable,
};
