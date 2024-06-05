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
 * @see https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/font-sizes#readme
 */
export default FontSizePicker;
