/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

const __experimentalWithPageTemplatePickerVisible = withSelect( ( select ) => {
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

	return {
		showPageTemplatePicker: isPageTemplatesEnabled && isEmpty && isPage,
	};
} );

export default __experimentalWithPageTemplatePickerVisible;
