// The icon is drawn inside a 24px box, and scaled down to fit a select item.
const BOX_SIZE = 24;
const ICON_SIZE = 20;
const STROKE_WIDTH = 1.5;
const FILL_OPACITY = 0.4;
// The distance from the edge of the box to the fill of each clip value. The
// `padding-box` fill stops short of the border, since at this size a fill that
// touches it can't be told apart from one that runs underneath it.
const FILL_INSETS: Record< string, number > = {
	'border-box': 4,
	'padding-box': 7,
	'content-box': 10,
};
// Stripes stand in for the letters that a `text` clip fills.
const TEXT_STRIPES = [ 7, 12, 17 ];

/**
 * Renders a box with the area that a `background-clip` value fills: the fill is
 * the background, the dashed edge the border. Values without a preview, like
 * 'default', get an empty icon, which keeps their label aligned with the others.
 *
 * @param props       Component props.
 * @param props.value CSS `background-clip` value, e.g. 'padding-box'.
 */
export default function BackgroundClipIcon( { value }: { value: string } ) {
	const fillInset = FILL_INSETS[ value ];

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={ `0 0 ${ BOX_SIZE } ${ BOX_SIZE }` }
			width={ ICON_SIZE }
			height={ ICON_SIZE }
			fill="none"
			stroke="currentColor"
			strokeWidth={ STROKE_WIDTH }
			aria-hidden="true"
			focusable="false"
		>
			{ fillInset !== undefined && (
				<>
					<rect
						x={ fillInset }
						y={ fillInset }
						width={ BOX_SIZE - fillInset * 2 }
						height={ BOX_SIZE - fillInset * 2 }
						rx="1"
						fill="currentColor"
						fillOpacity={ FILL_OPACITY }
						stroke="none"
					/>
					<rect
						x="4.75"
						y="4.75"
						width="14.5"
						height="14.5"
						rx="1.25"
						strokeDasharray="2.5 2"
					/>
				</>
			) }
			{ value === 'text' &&
				TEXT_STRIPES.map( ( y ) => (
					<line key={ y } x1="4" x2="20" y1={ y } y2={ y } />
				) ) }
		</svg>
	);
}
