/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';

const {
	useGlobalSetting,
	useGlobalStyle,
	EffectsPanel: StylesEffectsPanel,
	useSettingsForBlockElement,
} = unlock( blockEditorPrivateApis );

export default function EffectsPanel( { name, variation = '' } ) {
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
		<StylesEffectsPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
