/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import __experimentalUsePageTemplatePickerVisible from './use-page-template-picker-visible';

const __experimentalWithPageTemplatePickerVisible = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const showPageTemplatePicker = __experimentalUsePageTemplatePickerVisible();
		return (
			<WrappedComponent
				{ ...props }
				showPageTemplatePicker={ showPageTemplatePicker }
			/>
		);
	},
	'__experimentalWithPageTemplatePickerVisible'
);

export default __experimentalWithPageTemplatePickerVisible;
