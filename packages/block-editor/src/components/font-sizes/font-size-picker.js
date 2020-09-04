/**
 * WordPress dependencies
 */
import { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useEditorFeature from '../use-editor-feature';

function FontSizePicker( props ) {
	const fontSizes = useSelect(
		( select ) => select( 'core/block-editor' ).getSettings().fontSizes,
		[]
	);
	const disableCustomFontSizes = ! useEditorFeature( 'fontSize.custom' );

	return (
		<BaseFontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			disableCustomFontSizes={ disableCustomFontSizes }
		/>
	);
}

export default FontSizePicker;
