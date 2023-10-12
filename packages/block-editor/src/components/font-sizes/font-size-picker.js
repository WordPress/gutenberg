/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../use-setting';

function FontSizePicker( props ) {
	const [ fontSizes, customFontSizes ] = useSettings( [
		'typography.fontSizes',
		'typography.customFontSize',
	] );

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			disableCustomFontSizes={ ! customFontSizes }
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/font-sizes/README.md
 */
export default FontSizePicker;
