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
	TypographyPanel: StylesTypographyPanel,
} = unlock( blockEditorPrivateApis );

export default function TypographyPanel( { element, headingLevel } ) {
	let prefixParts = [];
	if ( element === 'heading' ) {
		prefixParts = prefixParts.concat( [ 'elements', headingLevel ] );
	} else if ( element && element !== 'text' ) {
		prefixParts = prefixParts.concat( [ 'elements', element ] );
	}
	const prefix = prefixParts.join( '.' );

	const [ style ] = useGlobalStyle( prefix, undefined, 'user', {
		shouldDecodeEncode: false,
	} );
	const [ inheritedStyle, setStyle ] = useGlobalStyle(
		prefix,
		undefined,
		'all',
		{
			shouldDecodeEncode: false,
		}
	);
	const [ rawSettings ] = useGlobalSetting( '' );
	const usedElement = element === 'heading' ? headingLevel : element;
	const settings = useSettingsForBlockElement(
		rawSettings,
		undefined,
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
