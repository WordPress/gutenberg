/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

function FontSizePicker( props ) {
	const fontSizes = useEditorFeature( 'typography.fontSizes' );
	const disableCustomFontSizes = ! useEditorFeature(
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
