/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const {
	useGlobalStyle,
	useGlobalSetting,
	useSettingsForBlockElement,
	BorderPanel: StylesBorderPanel,
} = unlock( blockEditorPrivateApis );

export default function BorderPanel( { name, variation = '' } ) {
	let prefixParts = [];
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( prefix, name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings ] = useGlobalSetting( '', name );
	const settings = useSettingsForBlockElement( rawSettings, name );

	return (
		<StylesBorderPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
