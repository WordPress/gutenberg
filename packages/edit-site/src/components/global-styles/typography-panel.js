/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../private-apis';
import { useSupportedStyles } from './hooks';

const {
	useGlobalStyle,
	useGlobalSetting,
	overrideSettingsWithSupports,
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
	const supports = useSupportedStyles( name, usedElement );
	const settings = useMemo(
		() => overrideSettingsWithSupports( rawSettings, supports ),
		[ rawSettings, supports ]
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
