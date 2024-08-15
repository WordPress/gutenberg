/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { parseQuantityAndUnitFromRawValue } from '../../unit-control/utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';

import type { Border, BorderControlProps } from '../types';

// If either width or color are defined, the border is considered valid
// and a border style can be set as well.
const isValidBorder = ( border?: Border ) => {
	const hasWidth = border?.width !== undefined && border.width !== '';
	const hasColor = border?.color !== undefined;
	return hasWidth || hasColor;
};

export function useBorderControl(
	props: WordPressComponentProps< BorderControlProps, 'div' >
) {
	const {
		className,
		colors = [],
		isCompact,
		onChange,
		enableAlpha = true,
		enableStyle = true,
		shouldSanitizeBorder = true,
		size = 'default',
		value: border,
		width,
		__experimentalIsRenderedInSidebar = false,
		__next40pxDefaultSize,
		...otherProps
	} = useContextSystem( props, 'BorderControl' );

	const computedSize =
		size === 'default' && __next40pxDefaultSize ? '__unstable-large' : size;

	const [ widthValue, originalWidthUnit ] = parseQuantityAndUnitFromRawValue(
		border?.width
	);
	const widthUnit = originalWidthUnit || 'px';
	const hadPreviousZeroWidth = widthValue === 0;

	const [ colorSelection, setColorSelection ] = useState< string >();
	const [ styleSelection, setStyleSelection ] = useState< string >();

	const isStyleSettable = shouldSanitizeBorder
		? isValidBorder( border )
		: true;

	const onBorderChange = useCallback(
		( newBorder?: Border ) => {
			if ( shouldSanitizeBorder && ! isValidBorder( newBorder ) ) {
				onChange( undefined );
				return;
			}
			onChange( newBorder );
		},
		[ onChange, shouldSanitizeBorder ]
	);

	const onWidthChange = useCallback(
		( newWidth?: string ) => {
			const newWidthValue = newWidth === '' ? undefined : newWidth;
			const [ parsedValue ] =
				parseQuantityAndUnitFromRawValue( newWidth );
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
		[
			border,
			hadPreviousZeroWidth,
			colorSelection,
			styleSelection,
			onBorderChange,
		]
	);

	const onSliderChange = useCallback(
		( value?: number ) => {
			onWidthChange( `${ value }${ widthUnit }` );
		},
		[ onWidthChange, widthUnit ]
	);

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderControl, className );
	}, [ className, cx ] );

	let wrapperWidth = width;
	if ( isCompact ) {
		// Widths below represent the minimum usable width for compact controls.
		// Taller controls contain greater internal padding, thus greater width.
		wrapperWidth = size === '__unstable-large' ? '116px' : '90px';
	}
	const innerWrapperClassName = useMemo( () => {
		const widthStyle = !! wrapperWidth && styles.wrapperWidth;
		const heightStyle = styles.wrapperHeight( computedSize );

		return cx( styles.innerWrapper(), widthStyle, heightStyle );
	}, [ wrapperWidth, cx, computedSize ] );

	const sliderClassName = useMemo( () => {
		return cx( styles.borderSlider() );
	}, [ cx ] );

	return {
		...otherProps,
		className: classes,
		colors,
		enableAlpha,
		enableStyle,
		innerWrapperClassName,
		inputWidth: wrapperWidth,
		isStyleSettable,
		onBorderChange,
		onSliderChange,
		onWidthChange,
		previousStyleSelection: styleSelection,
		sliderClassName,
		value: border,
		widthUnit,
		widthValue,
		size: computedSize,
		__experimentalIsRenderedInSidebar,
		__next40pxDefaultSize,
	};
}
