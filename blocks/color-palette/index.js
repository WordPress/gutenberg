/**
 * External dependencies
 */
import { CirclePicker } from 'react-color';

/**
 * Internal dependencies
 */
import withEditorSettings from '../with-editor-settings';

function ColorPalette( { colors, onChange, value } ) {
	return (
		<CirclePicker
			color={ value }
			colors={ colors }
			onChangeComplete={ ( colorValue ) => onChange( colorValue ) }
			style={ { marginBottom: '20px' } }
		/>
	);
}

export default withEditorSettings(
	( settings ) => ( {
		colors: settings.colors,
	} )
)( ColorPalette );
