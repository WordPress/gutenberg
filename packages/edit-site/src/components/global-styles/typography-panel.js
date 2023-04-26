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
	TypographyPanel: StylesTypographyPanel,
} = unlock( blockEditorPrivateApis );

export default function TypographyPanel( {
	name,
	element,
	headingLevel,
	variation = '',
} ) {
	let prefixParts = [];
	if ( element === 'heading' ) {
		prefixParts = prefixParts.concat( [ 'elements', headingLevel ] );
	} else if ( element && element !== 'text' ) {
		prefixParts = prefixParts.concat( [ 'elements', element ] );
	}
	if ( variation ) {
		prefixParts = [ 'variations', variation ].concat( prefixParts );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, name, 'user', false );
	const [ inheritedStyle, setStyle ] = useGlobalStyle( prefix, name, 'all', {
		shouldDecodeEncode: false,
	} );
	const [ rawSettings ] = useGlobalSetting( '', name );
	const usedElement = element === 'heading' ? headingLevel : element;
	const settings = useSettingsForBlockElement(
		rawSettings,
		name,
		usedElement
	);

	return (
		<StylesTypographyPanel
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
