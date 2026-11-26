import type { CSSProperties } from 'react';
import { useResizeObserver } from '@wordpress/compose';
import { useLayoutEffect, useMemo, useState } from '@wordpress/element';
import { getRotatedOverlayStyle } from '../../utils/rotation';

/** The size of an element's border box, in pixels. */
interface ElementSize {
	width: number;
	height: number;
}

/**
 * Gets the size of an element without its rotation. Offsets leave out CSS
 * transforms and the `rotate` property.
 *
 * @param element The element.
 *
 * @return The element's border box size.
 */
function getUnrotatedSize( element: HTMLElement ): ElementSize {
	return { width: element.offsetWidth, height: element.offsetHeight };
}

/**
 * Gets the style that keeps a block overlay, such as the resize handles,
 * aligned with a rotated grid item.
 *
 * The element's size is only tracked while it is rotated, and is kept up to
 * date when it changes, for example when an image in it loads or the grid
 * gets wider.
 *
 * @param blockElement The grid item element.
 * @param angle        Rotation in degrees.
 * @param baseStyle    Other style properties for the overlay.
 *
 * @return Style properties for the overlay.
 */
export function useRotatedOverlayStyle(
	blockElement: HTMLElement | null,
	angle: number,
	baseStyle?: CSSProperties
): CSSProperties | undefined {
	const [ size, setSize ] = useState< ElementSize | null >( null );
	const updateSize = ( element: HTMLElement ) =>
		setSize( ( previousSize ) => {
			const nextSize = getUnrotatedSize( element );
			return previousSize?.width === nextSize.width &&
				previousSize?.height === nextSize.height
				? previousSize
				: nextSize;
		} );
	const setObservedElement = useResizeObserver(
		( [ entry ] ) => updateSize( entry.target as HTMLElement ),
		{ box: 'border-box' }
	);
	const observedElement = angle ? blockElement : null;

	useLayoutEffect( () => {
		setObservedElement( observedElement );
		// Measure before the first paint, rather than waiting for the
		// observer's first notification.
		if ( observedElement ) {
			updateSize( observedElement );
		}
	}, [ observedElement, setObservedElement ] );

	return useMemo( () => {
		const rotatedStyle =
			size &&
			getRotatedOverlayStyle( {
				width: size.width,
				height: size.height,
				angle,
			} );
		if ( ! rotatedStyle ) {
			return baseStyle;
		}
		return { ...baseStyle, ...rotatedStyle };
	}, [ size, angle, baseStyle ] );
}
