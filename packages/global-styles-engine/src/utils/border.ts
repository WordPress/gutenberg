const BORDER_SIDES = [ 'top', 'right', 'bottom', 'left' ] as const;

type BorderSide = ( typeof BORDER_SIDES )[ number ];
type Border = {
	color?: unknown;
	style?: unknown;
	width?: unknown;
	[ key: string ]: unknown;
};

type SplitBorder = Partial< Record< BorderSide, Border | undefined > > &
	Record< string, unknown >;

type GetBorderWithFallbackStyleOptions = {
	removeStyleOnly?: boolean;
};

function hasSplitBorders( border: Border | SplitBorder ) {
	return BORDER_SIDES.some( ( side ) =>
		Object.prototype.hasOwnProperty.call( border, side )
	);
}

function hasColorOrWidth( border: Border ) {
	return !! border.color || !! border.width;
}

/**
 * Adds a fallback solid border style when a border color or width is present.
 *
 * CSS does not render border color or width unless a border style is also set.
 * This helper prepares border objects before they are compiled into CSS, which
 * is especially useful when styles are rendered in stylesheets rather than as
 * inline styles that can be matched by the block-library border fallback rules.
 *
 * @param border  Border style object, including optional split side objects.
 * @param options Fallback style options.
 * @return Border style object with a fallback style applied where needed.
 */
export function getBorderWithFallbackStyle< T >(
	border: T,
	options: GetBorderWithFallbackStyleOptions = {}
): T {
	if ( ! border || typeof border !== 'object' ) {
		return border;
	}

	if ( hasSplitBorders( border as Border | SplitBorder ) ) {
		return {
			...( border as SplitBorder ),
			top: getBorderWithFallbackStyle(
				( border as SplitBorder ).top,
				options
			),
			right: getBorderWithFallbackStyle(
				( border as SplitBorder ).right,
				options
			),
			bottom: getBorderWithFallbackStyle(
				( border as SplitBorder ).bottom,
				options
			),
			left: getBorderWithFallbackStyle(
				( border as SplitBorder ).left,
				options
			),
		} as T;
	}

	const singleBorder = border as Border;
	const hasVisibleBorder = hasColorOrWidth( singleBorder );

	if ( ! singleBorder.style && hasVisibleBorder ) {
		return {
			...singleBorder,
			style: 'solid',
		} as T;
	}

	if ( options.removeStyleOnly && singleBorder.style && ! hasVisibleBorder ) {
		return undefined as T;
	}

	return border;
}

/**
 * Adds fallback border styles to a style object containing a border object.
 *
 * @param style   Style object that may contain a `border` property.
 * @param options Fallback style options.
 * @return Style object with fallback border styles applied where needed.
 */
export function getStyleWithFallbackBorderStyles< T >(
	style: T,
	options: GetBorderWithFallbackStyleOptions = {}
): T {
	const styleRecord = style as Record< string, unknown >;
	if ( ! style || typeof style !== 'object' || ! styleRecord.border ) {
		return style;
	}

	return {
		...styleRecord,
		border: getBorderWithFallbackStyle( styleRecord.border, options ),
	} as T;
}
