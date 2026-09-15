import { __experimentalHasSplitBorders as hasSplitBorders } from '@wordpress/components';

function applyFallbackStyle( border: any ) {
	if ( ! border ) {
		return border;
	}

	const hasColorOrWidth = border.color || border.width;

	if ( ! border.style && hasColorOrWidth ) {
		return { ...border, style: 'solid' };
	}

	if ( border.style && ! hasColorOrWidth ) {
		return undefined;
	}

	return border;
}

function applyAllFallbackStyles( border: any ) {
	if ( ! border ) {
		return border;
	}

	if ( hasSplitBorders( border ) ) {
		return {
			top: applyFallbackStyle( border.top ),
			right: applyFallbackStyle( border.right ),
			bottom: applyFallbackStyle( border.bottom ),
			left: applyFallbackStyle( border.left ),
		};
	}

	return applyFallbackStyle( border );
}

/**
 * Prepares a style object from the border panel for storing in Global Styles.
 *
 * As Global Styles can't conditionally generate styles based on if other style
 * properties have been set, we need to force split border definitions for
 * user set global border styles. Border radius is derived from the same
 * property i.e. `border.radius` if it is a string that is used. The longhand
 * border radii styles are only generated if that property is an object.
 *
 * For borders (color, style, and width) those are all properties on the
 * `border` style property. This means if the theme.json defined split borders
 * and the user condenses them into a flat border or vice-versa we'd get both
 * sets of styles which would conflict.
 *
 * @param newStyle The style object as the border panel produced it.
 * @return The style object with its border ready to store.
 */
export function normalizeBorderStyle( newStyle: any ) {
	if ( ! newStyle?.border ) {
		return newStyle;
	}

	const { radius, ...newBorder } = newStyle.border;
	const border = applyAllFallbackStyles( newBorder );
	const updatedBorder = ! hasSplitBorders( border )
		? {
				top: border,
				right: border,
				bottom: border,
				left: border,
		  }
		: {
				color: null,
				style: null,
				width: null,
				...border,
		  };

	return { ...newStyle, border: { ...updatedBorder, radius } };
}
