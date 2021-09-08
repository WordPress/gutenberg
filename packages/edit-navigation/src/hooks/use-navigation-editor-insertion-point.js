/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

const useNavigationEditorInsertionPoint = () => {
	return useSelect( ( select ) => {
		const { getBlockOrder } = select( blockEditorStore );

		const lockedNavigationBlock = getBlockOrder()[ 0 ];

		return {
			rootClientId: lockedNavigationBlock,
		};
	}, [] );
};

export default useNavigationEditorInsertionPoint;
