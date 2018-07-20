/**
 * WordPress dependencies
 */
import { BaseControl, ColorIndicator } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './control.scss';
import ColorPalette from './';
import withColorContext from './with-color-context';
import { getColorName } from '../colors';

const ColorPaletteControl = withColorContext( ( { label, value, onChange, colorIndicatorAriaLabel, colors } ) => {
	const colorName = getColorName( value, colors );

	const labelElement = (
		<Fragment>
			{ label }
			{ value && (
				<ColorIndicator
					colorValue={ value }
					ariaLabel={ sprintf( colorIndicatorAriaLabel, colorName || value ) }
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
} );

export default ColorPaletteControl;
