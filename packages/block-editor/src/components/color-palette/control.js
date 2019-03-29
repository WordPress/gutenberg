/**
 * WordPress dependencies
 */
import { BaseControl, ColorIndicator } from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorPalette from './';
import withColorContext from './with-color-context';
import { getColorObjectByColorValue } from '../colors';

// translators: first %s: The type of color (e.g. background color), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(current %s: %s)' );

export function ColorPaletteControl( {
	colors,
	disableCustomColors,
	label,
	onChange,
	value,
} ) {
	const colorObject = getColorObjectByColorValue( colors, value );
	const colorName = colorObject && colorObject.name;
	const ariaLabel = sprintf( colorIndicatorAriaLabel, label.toLowerCase(), colorName || value );

	const labelElement = (
		<Fragment>
			{ label }
			{ value && (
				<ColorIndicator
					colorValue={ value }
					aria-label={ ariaLabel }
				/>
			) }
		</Fragment>
	);

	return (
		<BaseControl
			className="editor-color-palette-control block-editor-color-palette-control"
			label={ labelElement }>
			<ColorPalette
				className="editor-color-palette-control__color-palette block-editor-color-palette-control__color-palette"
				value={ value }
				onChange={ onChange }
				{ ... { colors, disableCustomColors } }
			/>
		</BaseControl>
	);
}

export default compose( [
	withColorContext,
	ifCondition( ( { hasColorsToChoose } ) => hasColorsToChoose ),
] )( ColorPaletteControl );
