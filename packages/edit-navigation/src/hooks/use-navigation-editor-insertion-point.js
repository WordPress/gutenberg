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

		return {
			rootClientId: getBlockOrder()[ 0 ],
		};
	}, [] );
};

export default useNavigationEditorInsertionPoint;
