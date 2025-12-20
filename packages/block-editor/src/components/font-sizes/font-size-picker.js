/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

function FontSizePicker( props ) {
	const [ fontSizes, customFontSize ] = useSettings(
		'typography.fontSizes',
		'typography.customFontSize'
	);

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			disableCustomFontSizes={ ! customFontSize }
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/font-sizes/README.md
 */
export default FontSizePicker;
