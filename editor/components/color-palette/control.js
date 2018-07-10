/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './control.scss';
import ColorPalette from './';
import TextWithColorIndicators from '../text-with-color-indicators';

const ColorPaletteControl = ( { label, ...props } ) => {
	const labelElement = (
		<TextWithColorIndicators
			colorSettings={ pick( props, [ 'value', 'colorIndicatorAriaLabel' ] ) }
		>
			{ label }
		</TextWithColorIndicators>
	);

	return (
		<BaseControl
			className="editor-color-palette-control"
			label={ labelElement }>
			<ColorPalette
				className="editor-color-palette-control__color-palette"
				{ ...pick( props, [ 'value', 'onChange' ] ) }
			/>
		</BaseControl>
	);
};

export default ColorPaletteControl;
