/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

const useNavigationEditorRootBlock = () => {
	return useSelect( ( select ) => {
		const { getBlockOrder } = select( blockEditorStore );

		const lockedNavigationBlock = getBlockOrder()[ 0 ];

		return {
			navBlockClientId: lockedNavigationBlock,
			lastNavBlockItemIndex: getBlockOrder( lockedNavigationBlock )
				.length,
		};
	}, [] );
};

export default useNavigationEditorRootBlock;
