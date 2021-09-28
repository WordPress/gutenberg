/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';

function FontSizePicker( props ) {
	const fontSizes = useSetting( 'typography.fontSizes' );
	const disableCustomFontSizes = ! useSetting( 'typography.customFontSize' );

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			disableCustomFontSizes={ disableCustomFontSizes }
		/>
	);
}

export default FontSizePicker;
