/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Size } from '../core/types';
import { degreesToRadians } from '../core/math/rotation';

/**
 * The return type of the useContainerFit hook.
 */
export interface UseContainerFitReturn {
	/** Ref to attach to the container element. */
	containerRef: React.RefObject< HTMLDivElement >;
	/** The current measured container dimensions. */
	containerSize: Size;
	/** Compute CSS properties to fit an image within the container. */
	getImageStyle: (
		naturalWidth: number,
		naturalHeight: number,
		rotation: number
	) => React.CSSProperties;
}

/**
 * Observes container dimensions via ResizeObserver and computes
 * how an image fits within that container using "contain" logic.
 *
 * The returned containerRef must be attached to the container element.
 * When the container resizes, containerSize is updated automatically.
 *
 * @return Container ref, measured size, and image style calculator.
 */
export function useContainerFit(): UseContainerFitReturn {
	const containerRef = useRef< HTMLDivElement >( null );
	const [ containerSize, setContainerSize ] = useState< Size >( {
		width: 0,
		height: 0,
	} );

	useEffect( () => {
		const element = containerRef.current;

		if ( ! element ) {
			return;
		}

		const observer = new ResizeObserver( ( entries ) => {
			for ( const entry of entries ) {
				const { width, height } = entry.contentRect;
				setContainerSize( ( prev ) => {
					if ( prev.width === width && prev.height === height ) {
						return prev;
					}
					return { width, height };
				} );
			}
		} );

		observer.observe( element );

		return () => {
			observer.disconnect();
		};
	}, [] );

	const getImageStyle = useCallback(
		(
			naturalWidth: number,
			naturalHeight: number,
			rotation: number
		): React.CSSProperties => {
			if (
				containerSize.width === 0 ||
				containerSize.height === 0 ||
				naturalWidth === 0 ||
				naturalHeight === 0
			) {
				return {};
			}

			// Compute the bounding box of the image after rotation.
			const rad = degreesToRadians( rotation );
			const cosR = Math.abs( Math.cos( rad ) );
			const sinR = Math.abs( Math.sin( rad ) );
			const rotatedWidth = cosR * naturalWidth + sinR * naturalHeight;
			const rotatedHeight = sinR * naturalWidth + cosR * naturalHeight;

			// "Contain" fit: scale the rotated bounding box to fit within the container.
			const scaleX = containerSize.width / rotatedWidth;
			const scaleY = containerSize.height / rotatedHeight;
			const scale = Math.min( scaleX, scaleY );

			const fittedWidth = naturalWidth * scale;
			const fittedHeight = naturalHeight * scale;

			return {
				width: fittedWidth,
				height: fittedHeight,
				maxWidth: fittedWidth,
				maxHeight: fittedHeight,
			};
		},
		[ containerSize ]
	);

	return {
		containerRef,
		containerSize,
		getImageStyle,
	};
}
