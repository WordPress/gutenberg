/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelColor as PanelColorComponent } from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import ColorPalette from '../color-palette';
import withColorContext from '../color-palette/with-color-context';
import { getColorObjectByColorValue } from '../colors';

function PanelColor( { colors, title, colorValue, initialOpen, ...props } ) {
	deprecated( 'wp.editor.PanelColor', {
		version: '4.3',
		alternative: 'wp.editor.PanelColorSettings',
		plugin: 'Gutenberg',
	} );

	const colorObject = getColorObjectByColorValue( colors, colorValue );
	const colorName = colorObject && colorObject.name;
	return (
		<PanelColorComponent { ...{ title, colorName, colorValue, initialOpen } } >
			<ColorPalette
				value={ colorValue }
				{ ...omit( props, [ 'disableCustomColors' ] ) }
			/>
		</PanelColorComponent>
	);
}

export default compose( [
	withColorContext,
	ifCondition( ( { hasColorsToChoose } ) => hasColorsToChoose ),
] )( PanelColor );
