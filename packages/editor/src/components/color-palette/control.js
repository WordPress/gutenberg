/**
 * WordPress dependencies
 */
import { BaseControl, ColorIndicator } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorPalette from './';
import withColorContext from './with-color-context';
import { getColorName } from '../colors';

// translators: first %s: The type of color (e.g. background color), second %s: the color name or value (e.g. red or #ff0000)
const colorIndicatorAriaLabel = __( '(current %s: %s)' );

export function ColorPaletteControl( { label, value, onChange, colors } ) {
	const colorName = getColorName( colors, value );
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
			className="editor-color-palette-control"
			label={ labelElement }>
			<ColorPalette
				className="editor-color-palette-control__color-palette"
				value={ value }
				onChange={ onChange }
			/>
		</BaseControl>
	);
}

export default withColorContext( ColorPaletteControl );
