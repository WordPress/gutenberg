/**
 * WordPress dependencies
 */
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../experiments';

const {
	useGlobalStyle,
	useGlobalSetting,
	TypographyPanel: StylesTypographyPanel,
} = unlock( blockEditorExperiments );

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
	const [ settings ] = useGlobalSetting( '', name );

	return (
		<StylesTypographyPanel
			name={ name }
			element={ element === 'heading' ? headingLevel : element }
			inheritedValue={ inheritedStyle }
			value={ style }
			onChange={ setStyle }
			settings={ settings }
		/>
	);
}
