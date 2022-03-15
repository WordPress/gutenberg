/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { parseQuantityAndUnitFromRawValue } from '../../unit-control/utils';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

import type { Border, BorderControlProps } from '../types';

const sanitizeBorder = ( border?: Border ) => {
	const hasNoWidth = border?.width === undefined || border.width === '';
	const hasNoColor = border?.color === undefined;

	// If width and color are undefined, unset any style selection as well.
	if ( hasNoWidth && hasNoColor ) {
		return undefined;
	}

	return border;
};

export function useBorderControl(
	props: WordPressComponentProps< BorderControlProps, 'div' >
) {
	const {
		className,
		isCompact,
		onChange,
		shouldSanitizeBorder = true,
		value: border,
		width,
		...otherProps
	} = useContextSystem( props, 'BorderControl' );

	const [ widthValue, originalWidthUnit ] = parseQuantityAndUnitFromRawValue(
		border?.width
	);
	const widthUnit = originalWidthUnit || 'px';
	const hadPreviousZeroWidth = widthValue === 0;

	const [ colorSelection, setColorSelection ] = useState< string >();
	const [ styleSelection, setStyleSelection ] = useState< string >();

	const onBorderChange = useCallback(
		( newBorder?: Border ) => {
			if ( shouldSanitizeBorder ) {
				return onChange( sanitizeBorder( newBorder ) );
			}

			onChange( newBorder );
		},
		[ onChange, shouldSanitizeBorder, sanitizeBorder ]
	);

	const onWidthChange = useCallback(
		( newWidth?: string ) => {
			const newWidthValue = newWidth === '' ? undefined : newWidth;
			const [ parsedValue ] = parseQuantityAndUnitFromRawValue(
				newWidth
			);
			const hasZeroWidth = parsedValue === 0;

			const updatedBorder = { ...border, width: newWidthValue };

			// Setting the border width explicitly to zero will also set the
			// border style to `none` and clear the border color.
			if ( hasZeroWidth && ! hadPreviousZeroWidth ) {
				// Before clearing the color and style selections, keep track of
				// the current selections so they can be restored when the width
				// changes to a non-zero value.
				setColorSelection( border?.color );
				setStyleSelection( border?.style );

				// Clear the color and style border properties.
				updatedBorder.color = undefined;
				updatedBorder.style = 'none';
			}

			// Selection has changed from zero border width to non-zero width.
			if ( ! hasZeroWidth && hadPreviousZeroWidth ) {
				// Restore previous border color and style selections if width
				// is now not zero.
				if ( updatedBorder.color === undefined ) {
					updatedBorder.color = colorSelection;
				}
				if ( updatedBorder.style === 'none' ) {
					updatedBorder.style = styleSelection;
				}
			}

			onBorderChange( updatedBorder );
		},
		[ border, hadPreviousZeroWidth, onBorderChange ]
	);

	const onSliderChange = useCallback(
		( value: string ) => {
			onWidthChange( `${ value }${ widthUnit }` );
		},
		[ onWidthChange, widthUnit ]
	);

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.BorderControl, className );
	}, [ className, cx ] );

	const innerWrapperClassName = useMemo( () => {
		const wrapperWidth = isCompact ? '90px' : width;
		const widthStyle =
			!! wrapperWidth && styles.WrapperWidth( wrapperWidth );

		return cx( styles.InnerWrapper, widthStyle );
	}, [ isCompact, width, cx ] );

	const widthControlClassName = useMemo( () => {
		return cx( styles.BorderWidthControl );
	}, [ cx ] );

	const sliderClassName = useMemo( () => {
		return cx( styles.BorderSlider );
	}, [ cx ] );

	return {
		...otherProps,
		className: classes,
		innerWrapperClassName,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		previousStyleSelection: styleSelection,
		sliderClassName,
		value: border,
		widthControlClassName,
		widthUnit,
		widthValue,
	};
}
