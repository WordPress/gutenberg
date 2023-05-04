/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const { useGlobalStyle, AdvancedPanel: StylesAdvancedPanel } = unlock(
	blockEditorPrivateApis
);

function CustomCSSControl( { blockName } ) {
	const [ style ] = useGlobalStyle( '', blockName, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', blockName, 'all', {
		shouldDecodeEncode: false,
	} );

	return (
		<StylesAdvancedPanel
			value={ style }
			onChange={ setStyle }
			inheritedValue={ inheritedStyle }
		/>
	);
}

export default CustomCSSControl;
