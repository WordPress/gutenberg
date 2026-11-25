import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';
import { useSettings } from '../use-settings';
import type { FontSizePickerPresets, FontSizePickerProps } from './types';

function FontSizePicker( props: FontSizePickerProps ) {
	const [ fontSizes, customFontSize ] = useSettings(
		'typography.fontSizes',
		'typography.customFontSize'
	);

	return (
		<BaseFontSizePicker
			{ ...props }
			// The setting lists the font size presets.
			fontSizes={ fontSizes as FontSizePickerPresets }
			disableCustomFontSizes={ ! customFontSize }
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/font-sizes/README.md
 */
export default FontSizePicker;
