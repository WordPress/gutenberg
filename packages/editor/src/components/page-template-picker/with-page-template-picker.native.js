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
		const isTemplatePickerEnabled = ! ( props.modalLayoutPicker ?? false );
		const isTemplatePickerVisible =
			isTemplatePickerEnabled &&
			__experimentalUsePageTemplatePickerVisible();
		const isTemplatePickerAvailable =
			isTemplatePickerEnabled &&
			__experimentalUsePageTemplatePickerAvailable();

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
