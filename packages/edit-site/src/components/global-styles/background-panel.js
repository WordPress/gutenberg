/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	BackgroundPanel: StylesBackgroundPanel,
} = unlock( blockEditorPrivateApis );

export default function BackgroundPanel() {
	const [ style ] = useGlobalStyle( '', undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( '', undefined, 'all', {
		shouldDecodeEncode: false,
	} );

	const [ rawSettings ] = useGlobalSetting( '' );
	const settings = useSettingsForBlockElement( rawSettings );
console.log( 'inheritedStyle', inheritedStyle );
	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
