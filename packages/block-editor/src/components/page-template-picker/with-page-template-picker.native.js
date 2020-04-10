/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	__experimentalUsePageTemplatePickerVisible,
	__experimentalUsePageTemplatePickerAvailable,
} from './use-page-template-picker';

const __experimentalWithPageTemplatePicker = createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const isTemplatePickerVisible = __experimentalUsePageTemplatePickerVisible();
		const isTemplatePickerAvailable = __experimentalUsePageTemplatePickerAvailable();

		return (
			<WrappedComponent
				{ ...props }
				isTemplatePickerVisible={ isTemplatePickerVisible }
				isTemplatePickerAvailable={ isTemplatePickerAvailable }
			/>
		);
	},
	'__experimentalWithPageTemplatePicker'
);

export default __experimentalWithPageTemplatePicker;
