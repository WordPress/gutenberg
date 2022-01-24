/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import { removeBorderAttribute } from './border';
import useSetting from '../components/use-setting';

const MIN_BORDER_WIDTH = 0;

/**
 * Inspector control for configuring border width property.
 *
 * @param {Object} props Block properties.
 *
 * @return {WPElement} Border width edit element.
 */
export const BorderWidthEdit = ( props ) => {
	const {
		attributes: { borderColor, style },
		setAttributes,
	} = props;

	const { width, color: customBorderColor, style: borderStyle } =
		style?.border || {};

	// Used to temporarily track previous border color & style selections to be
	// able to restore them when border width changes from zero value.
	const [ styleSelection, setStyleSelection ] = useState();
	const [ colorSelection, setColorSelection ] = useState();
	const [ customColorSelection, setCustomColorSelection ] = useState();

	const onChange = ( newWidth ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				width: newWidth,
			},
		};

		// Used to clear named border color attribute.
		let borderPaletteColor = borderColor;

		const hasZeroWidth = parseFloat( newWidth ) === 0;
		const hadPreviousZeroWidth = parseFloat( width ) === 0;

		// Setting the border width explicitly to zero will also set the
		// border style to `none` and clear border color attributes.
		if ( hasZeroWidth && ! hadPreviousZeroWidth ) {
			// Before clearing color and style selections, keep track of
			// the current selections so they can be restored when the width
			// changes to a non-zero value.
			setColorSelection( borderColor );
			setCustomColorSelection( customBorderColor );
			setStyleSelection( borderStyle );

			// Clear style and color attributes.
			borderPaletteColor = undefined;
			newStyle.border.color = undefined;
			newStyle.border.style = 'none';
		}

		if ( ! hasZeroWidth && hadPreviousZeroWidth ) {
			// Restore previous border style selection if width is now not zero and
			// border style was 'none'. This is to support changes to the UI which
			// change the border style UI to a segmented control without a "none"
			// option.
			if ( borderStyle === 'none' ) {
				newStyle.border.style = styleSelection;
			}

			// Restore previous border color selection if width is no longer zero
			// and current border color is undefined.
			if ( borderColor === undefined ) {
				borderPaletteColor = colorSelection;
				newStyle.border.color = customColorSelection;
			}
		}

		// If width was reset, clean out undefined styles.
		if ( newWidth === undefined || newWidth === '' ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( {
			borderColor: borderPaletteColor,
			style: newStyle,
		} );
	};

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [ 'px', 'em', 'rem' ],
	} );

	return (
		<UnitControl
			value={ width }
			label={ __( 'Width' ) }
			min={ MIN_BORDER_WIDTH }
			onChange={ onChange }
			units={ units }
		/>
	);
};

/**
 * Checks if there is a current value in the border width block support
 * attributes.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a border width value set.
 */
export function hasBorderWidthValue( props ) {
	return !! props.attributes.style?.border?.width;
}

/**
 * Resets the border width block support attribute. This can be used when
 * disabling the border width support control for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetBorderWidth( { attributes = {}, setAttributes } ) {
	const { style } = attributes;
	setAttributes( { style: removeBorderAttribute( style, 'width' ) } );
}
