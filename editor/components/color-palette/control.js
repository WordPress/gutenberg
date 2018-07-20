/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './control.scss';
import ColorPalette from './';
import ColorIndicator from '../color-indicator';

const ColorPaletteControl = ( { label, value, colorIndicatorAriaLabel, onChange } ) => {
	const labelElement = (
		<Fragment>
			{ label }
			{ value && (
				<ColorIndicator
					colorValue={ value }
					ariaLabel={ colorIndicatorAriaLabel }
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
};

export default ColorPaletteControl;
