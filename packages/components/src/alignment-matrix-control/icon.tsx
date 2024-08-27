/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Rect, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { ALIGNMENTS } from './utils';
import type { AlignmentMatrixControlIconProps } from './types';
import type { WordPressComponentProps } from '../context';

const BASE_SIZE = 24;
const GRID_CELL_SIZE = 7;
const GRID_PADDING = ( BASE_SIZE - 3 * GRID_CELL_SIZE ) / 2;
const DOT_SIZE = 2;
const DOT_SIZE_SELECTED = 4;

function AlignmentMatrixControlIcon( {
	className,
	disablePointerEvents = true,
	size,
	width,
	height, // extracted so that it doesn't apply to the DOM
	style = {},
	value = 'center',
	...props
}: WordPressComponentProps< AlignmentMatrixControlIconProps, 'svg', false > ) {
	const computedWidth = size ?? width ?? BASE_SIZE;
	const computedHeight = size ?? width ?? BASE_SIZE;

	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			// TODO: should we keep the viewbox?
			viewBox={ `0 0 ${ BASE_SIZE } ${ BASE_SIZE }` }
			width={ computedWidth }
			height={ computedHeight }
			role="presentation"
			className={ clsx(
				'component-alignment-matrix-control-icon',
				className
			) }
			style={ {
				// TODO: move to emotion?
				pointerEvents: disablePointerEvents ? 'none' : undefined,
				...style,
			} }
			{ ...props }
		>
			{ ALIGNMENTS.map( ( align, index ) => {
				const dotSize = align === value ? DOT_SIZE_SELECTED : DOT_SIZE;

				return (
					<Rect
						key={ align }
						x={
							GRID_PADDING +
							( index % 3 ) * GRID_CELL_SIZE +
							( GRID_CELL_SIZE - dotSize ) / 2
						}
						y={
							GRID_PADDING +
							Math.floor( index / 3 ) * GRID_CELL_SIZE +
							( GRID_CELL_SIZE - dotSize ) / 2
						}
						width={ dotSize }
						height={ dotSize }
						fill="currentColor"
					/>
				);
			} ) }
		</SVG>
	);
}

export default AlignmentMatrixControlIcon;
