/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

const __experimentalUsePageTemplatePickerVisible = () => {
	return useSelect( ( select ) => {
		const {
			getCurrentPostType,
		} = select( 'core/editor' );

		const {
			getBlockCount,
			getSettings,
		} = select( 'core/block-editor' );

		const isPageTemplatesEnabled = getSettings().__experimentalEnablePageTemplates;
		const isEmpty = getBlockCount() === 0;
		const isPage = getCurrentPostType() === 'page';

		return isPageTemplatesEnabled && isEmpty && isPage;
	} );
};

export default __experimentalUsePageTemplatePickerVisible;
