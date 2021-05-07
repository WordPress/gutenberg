/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useThemeSetting from '../use-theme-setting';

function FontSizePicker( props ) {
	const fontSizes = useThemeSetting( 'typography.fontSizes' );
	const disableCustomFontSizes = ! useThemeSetting(
		'typography.customFontSize'
	);

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			disableCustomFontSizes={ disableCustomFontSizes }
		/>
	);
}

export default FontSizePicker;
