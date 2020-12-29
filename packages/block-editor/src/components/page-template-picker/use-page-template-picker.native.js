/**
 * WordPress dependencies
 */
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

export const __experimentalUsePageTemplatePickerAvailable = () => {
	return useSelect( ( select ) => {
		const { getCurrentPostType } = select( 'core/editor' );
		return getCurrentPostType() === 'page';
	}, [] );
};

export const __experimentalUsePageTemplatePickerVisible = () => {
	const isTemplatePickerAvailable = __experimentalUsePageTemplatePickerAvailable();

	return useSelect( ( select ) => {
		const { getBlockOrder, getBlock } = select( 'core/block-editor' );

		const blocks = getBlockOrder();
		const isEmptyBlockList = blocks.length === 0;
		const firstBlock = ! isEmptyBlockList && getBlock( blocks[ 0 ] );
		const isOnlyUnmodifiedDefault =
			blocks.length === 1 && isUnmodifiedDefaultBlock( firstBlock );
		const isEmptyContent = isEmptyBlockList || isOnlyUnmodifiedDefault;

		return isEmptyContent && isTemplatePickerAvailable;
	}, [] );
};
