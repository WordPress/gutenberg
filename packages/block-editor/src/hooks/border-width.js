/**
 * WordPress dependencies
 */
import {
	__experimentalUnitControl as UnitControl,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
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
	const [ styleSelection, setStyleSelection ] = useState();
	const [ colorSelection, setColorSelection ] = useState();

	// Temporarily track previous border color & style selections to be able to
	// restore them when border width changes from zero value.
	useEffect( () => {
		if ( borderStyle !== 'none' ) {
			setStyleSelection( borderStyle );
		}
	}, [ borderStyle ] );

	useEffect( () => {
		if ( borderColor || customBorderColor ) {
			setColorSelection( {
				name: !! borderColor ? borderColor : undefined,
				color: !! customBorderColor ? customBorderColor : undefined,
			} );
		}
	}, [ borderColor, customBorderColor ] );

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

		// Setting the border width explicitly to zero will also set the
		// border style to `none` and clear border color attributes.
		if ( hasZeroWidth ) {
			borderPaletteColor = undefined;
			newStyle.border.color = undefined;
			newStyle.border.style = 'none';
		}

		// Restore previous border style selection if width is now not zero and
		// border style was 'none'. This is to support changes to the UI which
		// change the border style UI to a segmented control without a "none"
		// option.
		if ( ! hasZeroWidth && borderStyle === 'none' ) {
			newStyle.border.style = styleSelection;
		}

		// Restore previous border color selection if width is no longer zero
		// and current border color is undefined.
		if ( ! hasZeroWidth && borderColor === undefined ) {
			borderPaletteColor = colorSelection?.name;
			newStyle.border.color = colorSelection?.color;
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
