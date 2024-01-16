/**
 * Internal dependencies
 */
import { store as blockEditorStore } from './';

export const __experimentalGetBlockPatternsFromSettings =
	() =>
	async ( { select, dispatch } ) => {
		const { fetchBlockPatterns } = select( blockEditorStore ).getSettings();
		const patterns = await fetchBlockPatterns();
		dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
	};
