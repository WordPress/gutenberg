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
		attributes: { style },
		setAttributes,
	} = props;

	const { width, style: borderStyle } = style?.border || {};
	const [ styleSelection, setStyleSelection ] = useState();

	// Temporarily track previous border style selection to be able to restore
	// it when border width changes from zero value.
	useEffect( () => {
		if ( borderStyle !== 'none' ) {
			setStyleSelection( borderStyle );
		}
	}, [ borderStyle ] );

	const onChange = ( newWidth ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				width: newWidth,
			},
		};

		const hasZeroWidth = parseFloat( newWidth ) === 0;

		// Setting the border width explicitly to zero will also set the
		// border style prop to `none`. This style will only be applied if
		// border style support has also been opted into.
		if ( hasZeroWidth ) {
			newStyle.border.style = 'none';
		}

		// Restore previous border style selection if width is now not zero and
		// border style was 'none'. This is to support changes to the UI which
		// change the border style UI to a segmented control without a "none"
		// option.
		if ( ! hasZeroWidth && borderStyle === 'none' ) {
			newStyle.border.style = styleSelection;
		}

		// If width was reset, clean out undefined styles.
		if ( newWidth === undefined || newWidth === '' ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: newStyle } );
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
