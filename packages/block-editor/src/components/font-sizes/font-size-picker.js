/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-settings';

function FontSizePicker( props ) {
	const [ customFontSize, ...fontSizesByOrigin ] = useSettings(
		'typography.customFontSize',
		'typography.fontSizes.custom',
		'typography.fontSizes.theme',
		'typography.fontSizes.default'
	);

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizesByOrigin.find(
				( origin ) => origin !== undefined
			) }
			disableCustomFontSizes={ ! customFontSize }
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/font-sizes/README.md
 */
export default FontSizePicker;
