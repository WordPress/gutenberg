/**
 * External dependencies
 */
import { noop } from 'lodash';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

const { clearTimeout = () => undefined, setTimeout = () => undefined } =
	typeof window !== 'undefined' ? window : {};

export type Axis = 'x' | 'y';

export const POSITIONS = {
	bottom: 'bottom',
	corner: 'corner',
} as const;

export type Position = typeof POSITIONS[ keyof typeof POSITIONS ];

interface UseResizeLabelProps {
	/** The label value. */
	label?: string;
	/** Element to be rendered for resize listening events. */
	resizeListener: JSX.Element;
}

interface UseResizeLabelArgs {
	axis?: Axis;
	fadeTimeout: number;
	onResize( data: { width: number | null; height: number | null } ): void;
	position: Position;
	showPx: boolean;
}

/**
 * Custom hook that manages resize listener events. It also provides a label
 * based on current resize width x height values.
 *
 * @param  props
 * @param  props.axis        Only shows the label corresponding to the axis.
 * @param  props.fadeTimeout Duration (ms) before deactivating the resize label.
 * @param  props.onResize    Callback when a resize occurs. Provides { width, height } callback.
 * @param  props.position    Adjusts label value.
 * @param  props.showPx      Whether to add `PX` to the label.
 *
 * @return Properties for hook.
 */
export function useResizeLabel( {
	axis,
	fadeTimeout = 180,
	onResize = noop,
	position = POSITIONS.bottom,
	showPx = false,
}: UseResizeLabelArgs ): UseResizeLabelProps {
	/*
	 * The width/height values derive from this special useResizeAware hook.
	 * This custom hook uses injects an iFrame into the element, allowing it
	 * to tap into the onResize (window) callback events.
	 */
	const [ resizeListener, sizes ] = useResizeAware();

	/*
	 * Indicates if the x/y axis is preferred.
	 * If set, we will avoid resetting the moveX and moveY values.
	 * This will allow for the preferred axis values to persist in the label.
	 */
	const isAxisControlled = !! axis;

	/*
	 * The moveX and moveY values are used to track whether the label should
	 * display width, height, or width x height.
	 */
	const [ moveX, setMoveX ] = useState( false );
	const [ moveY, setMoveY ] = useState( false );

	/*
	 * Cached dimension values to check for width/height updates from the
	 * sizes property from useResizeAware()
	 */
	const { width, height } = sizes;
	const heightRef = useRef( height );
	const widthRef = useRef( width );

	/*
	 * This timeout is used with setMoveX and setMoveY to determine of
	 * both width and height values have changed at (roughly) the same time.
	 */
	const moveTimeoutRef = useRef< number >();

	const unsetMoveXY = () => {
		/*
		 * If axis is controlled, we will avoid resetting the moveX and moveY values.
		 * This will allow for the preferred axis values to persist in the label.
		 */
		if ( isAxisControlled ) return;
		setMoveX( false );
		setMoveY( false );
	};

	const debounceUnsetMoveXY = () => {
		if ( moveTimeoutRef.current ) {
			clearTimeout( moveTimeoutRef.current );
		}

		moveTimeoutRef.current = setTimeout( unsetMoveXY, fadeTimeout );
	};

	useEffect( () => {
		/*
		 * On the initial render of useResizeAware, the height and width values are
		 * null. They are calculated then set using via an internal useEffect hook.
		 */
		const isRendered = width !== null || height !== null;

		if ( ! isRendered ) return;

		const didWidthChange = width !== widthRef.current;
		const didHeightChange = height !== heightRef.current;

		if ( ! didWidthChange && ! didHeightChange ) return;

		/*
		 * After the initial render, the useResizeAware will set the first
		 * width and height values. We'll sync those values with our
		 * width and height refs. However, we shouldn't render our Tooltip
		 * label on this first cycle.
		 */
		if ( width && ! widthRef.current && height && ! heightRef.current ) {
			widthRef.current = width;
			heightRef.current = height;
			return;
		}

		/*
		 * After the first cycle, we can track width and height changes.
		 */
		if ( didWidthChange ) {
			setMoveX( true );
			widthRef.current = width;
		}

		if ( didHeightChange ) {
			setMoveY( true );
			heightRef.current = height;
		}

		onResize( { width, height } );
		debounceUnsetMoveXY();
	}, [ width, height ] );

	const label = getSizeLabel( {
		axis,
		height,
		moveX,
		moveY,
		position,
		showPx,
		width,
	} );

	return {
		label,
		resizeListener,
	};
}

interface GetSizeLabelArgs {
	axis?: Axis;
	height: number | null;
	moveX: boolean;
	moveY: boolean;
	position: Position;
	showPx: boolean;
	width: number | null;
}

/**
 * Gets the resize label based on width and height values (as well as recent changes).
 *
 * @param  props
 * @param  props.axis     Only shows the label corresponding to the axis.
 * @param  props.height   Height value.
 * @param  props.moveX    Recent width (x axis) changes.
 * @param  props.moveY    Recent width (y axis) changes.
 * @param  props.position Adjusts label value.
 * @param  props.showPx   Whether to add `PX` to the label.
 * @param  props.width    Width value.
 *
 * @return The rendered label.
 */
function getSizeLabel( {
	axis,
	height,
	moveX = false,
	moveY = false,
	position = POSITIONS.bottom,
	showPx = false,
	width,
}: GetSizeLabelArgs ): string | undefined {
	if ( ! moveX && ! moveY ) return undefined;

	/*
	 * Corner position...
	 * We want the label to appear like width x height.
	 */
	if ( position === POSITIONS.corner ) {
		return `${ width } x ${ height }`;
	}

	/*
	 * Other POSITIONS...
	 * The label will combine both width x height values if both
	 * values have recently been changed.
	 *
	 * Otherwise, only width or height will be displayed.
	 * The `PX` unit will be added, if specified by the `showPx` prop.
	 */
	const labelUnit = showPx ? ' px' : '';

	if ( axis ) {
		if ( axis === 'x' && moveX ) {
			return `${ width }${ labelUnit }`;
		}
		if ( axis === 'y' && moveY ) {
			return `${ height }${ labelUnit }`;
		}
	}

	if ( moveX && moveY ) {
		return `${ width } x ${ height }`;
	}
	if ( moveX ) {
		return `${ width }${ labelUnit }`;
	}
	if ( moveY ) {
		return `${ height }${ labelUnit }`;
	}

	return undefined;
}
