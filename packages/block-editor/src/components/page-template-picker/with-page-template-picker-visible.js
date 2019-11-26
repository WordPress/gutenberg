/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import __experimentalUsePageTemplatePickerVisible from './use-page-template-picker-visible';

const __experimentalWithPageTemplatePickerVisible = createHigherOrderComponent( ( WrappedComponent ) => {
	const showPageTemplatePicker = __experimentalUsePageTemplatePickerVisible();
	return (
		<WrappedComponent showPageTemplatePicker={ showPageTemplatePicker } />
	);
} );

export default __experimentalWithPageTemplatePickerVisible;
