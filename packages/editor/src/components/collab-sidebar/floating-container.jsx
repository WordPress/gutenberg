import clsx from 'clsx';
import { Stack } from '@wordpress/ui';

export function FloatingContainer( {
	floating,
	className,
	style,
	children,
	...props
} ) {
	const isFloating = !! floating;
	/*
	 * The board resolves a thread's `y` from its anchor's measured rect, so
	 * there is a beat after mount — and after any change that invalidates the
	 * anchors — where a thread has no position yet. An absolutely positioned
	 * card with no `top` does not stay put: it falls back to its static
	 * position, which is the panel's origin, so every unpositioned card piles
	 * up there on top of whichever card legitimately sits at the top of the
	 * board and, being later in tree order, wins the hit test and swallows
	 * clicks meant for it — including a suggestion's Accept button.
	 *
	 * Take it out of the hit test until the board has placed it, and fade it
	 * so the pile never paints. Deliberately not `visibility` or `display`:
	 * the board's ResizeObserver still has to measure the card's height to
	 * work out where it goes, and the card still has to be focusable — the
	 * pending new-note form is focused the moment it mounts.
	 */
	const isPlaced = ! isFloating || floating.y !== undefined;
	return (
		<Stack
			direction="column"
			className={ clsx( className, { 'is-floating': isFloating } ) }
			ref={ isFloating ? floating.ref : undefined }
			style={
				isFloating
					? {
							top: floating.y,
							...( isPlaced
								? undefined
								: {
										opacity: 0,
										pointerEvents: 'none',
								  } ),
							...style,
					  }
					: style
			}
			{ ...props }
		>
			{ children }
		</Stack>
	);
}
