/**
 * External dependencies
 */
import { noop } from 'lodash';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

const { clearTimeout } = window;

export const POSITIONS = {
	bottom: 'bottom',
	cursor: 'cursor',
	corner: 'corner',
};

/**
 * @typedef {Object} UseResizeLabelProps
 *
 * @property {boolean} isActive The visibility of the label.
 * @property {undefined|string} label The label value.
 * @property {Function} resizeListener Element to be rendered for resize listening events.
 */

/**
 * Custom hook that manages resize listener events. It also provides a label
 * based on current resize width x height values.
 *
 * @param {Object} props
 * @param {string} props.axis Only shows the label corresponding to the axis.
 * @param {number} props.fadeTimeout Duration (ms) before deactivating the resize label.
 * @param {Function} props.onMove Callback when a resize occurs. Provides onMouseEvent event callback.
 * @param {boolean} props.onResize Callback when a resize occurs. Provides { width, height } callback.
 * @param {string} props.position Adjusts label value.
 * @param {boolean} props.showPx Whether to add `PX` to the label.
 *
 * @return {UseResizeLabelProps} Properties for hook.
 */
export function useResizeLabel( {
	axis,
	fadeTimeout = 180,
	onMove = noop,
	onResize = noop,
	position = POSITIONS.cursor,
	showPx = false,
} ) {
	const [ isDragging, setIsDragging ] = useState( false );
	const [ isActive, setIsActive ] = useState( false );
	/**
	 * The width/height values derive from this special useResizeAwere hook.
	 * This custom hook uses injects an iFrame into the element, allowing it
	 * to tap into the onResize (window) callback events.
	 */
	const [ resizeListener, sizes ] = useResizeAware();

	/**
	 * The moveX and moveY values are used to track whether the label should
	 * display width, height, or width x height.
	 */
	const [ moveX, setMoveX ] = useState( false );
	const [ moveY, setMoveY ] = useState( false );

	/**
	 * Cached dimension values to check for width/height updates from the
	 * sizes property from useResizeAware()
	 */
	const heightRef = useRef( height );
	const widthRef = useRef( width );

	/**
	 * This timeout is used with setMoveX and setMoveY to determine of
	 * both width and height values have changed at (roughly) the same time.
	 */
	const moveTimeoutRef = useRef();

	const { width, height } = sizes;

	/**
	 * On the initial render of useResizeAware, the height and width values are
	 * null. They are calculated then set using via an internal useEffect hook.
	 */
	const isRendered = width !== null && height !== null;

	useEffect( () => {
		if ( width === null ) return;

		const didWidthChange = width !== widthRef.current;
		const didHeightChange = height !== heightRef.current;

		if ( ! didWidthChange && ! didHeightChange ) return;

		if ( didWidthChange ) {
			setMoveX( true );
		}

		if ( didHeightChange ) {
			setMoveY( true );
		}

		onResize( { width, height } );
	}, [ width, height ] );

	useEffect( () => {
		const handleOnMouseDown = () => {
			if ( moveTimeoutRef.current ) {
				clearTimeout( moveTimeoutRef.current );
			}
			setIsDragging( true );
			setMoveX( false );
			setMoveY( false );
		};

		const handleOnMouseUp = () => {
			setIsDragging( false );
			setIsActive( false );

			if ( moveTimeoutRef.current ) {
				clearTimeout( moveTimeoutRef.current );
			}

			moveTimeoutRef.current = setTimeout( () => {
				setMoveX( false );
				setMoveY( false );
			}, fadeTimeout * 2 );
		};

		const handleOnMouseMove = ( event ) => {
			if ( ! isDragging ) return;

			if ( width !== widthRef.current || height !== heightRef.current ) {
				widthRef.current = width;
				heightRef.current = height;

				onMove( event );
				setIsActive( true );
			}
		};

		document.addEventListener( 'mousedown', handleOnMouseDown );
		document.addEventListener( 'mousemove', handleOnMouseMove );
		document.addEventListener( 'mouseup', handleOnMouseUp );

		return () => {
			document.removeEventListener( 'mousedown', handleOnMouseDown );
			document.removeEventListener( 'mousemove', handleOnMouseMove );
			document.removeEventListener( 'mouseup', handleOnMouseUp );
		};
	}, [ width, height, isActive, isRendered, isDragging ] );

	const label = getSizeLabel( {
		axis,
		moveX,
		moveY,
		width,
		height,
		showPx,
		position,
	} );

	return {
		isActive,
		label,
		resizeListener,
	};
}

/**
 * Gets the resize label based on width and height values (as well as recent changes).
 *
 * @param {Object} props
 * @param {string} props.axis Only shows the label corresponding to the axis.
 * @param {number} props.height Height value.
 * @param {boolean} props.moveX Recent width (x axis) changes.
 * @param {boolean} props.moveY Recent width (y axis) changes.
 * @param {string} props.position Adjusts label value.
 * @param {boolean} props.showPx Whether to add `PX` to the label.
 * @param {number} props.width Width value.
 *
 * @return {undefined | string} The rendered label.
 */
function getSizeLabel( {
	axis,
	height,
	moveX = false,
	moveY = false,
	position = POSITIONS.cursor,
	showPx = false,
	width,
} ) {
	let label;

	/**
	 * Corner position...
	 * We want the label to appear like width x height.
	 */
	if ( position === POSITIONS.corner ) {
		return `${ width } x ${ height }`;
	}

	/**
	 * Other POSITIONS...
	 * The label will combine both width x height values if both
	 * values have recently been changed.
	 *
	 * Otherwise, only width or height will be displayed.
	 * The `PX` unit will be added, if specified by the `showPx` prop.
	 */
	if ( moveX && moveY && ! axis ) {
		// Width x Height changes...
		label = `${ width } x ${ height }`;
	} else if ( moveY && axis !== 'x' ) {
		// Height changes...
		label = `${ height }`;
		if ( showPx ) {
			label = `${ label } PX`;
		}
	} else if ( moveX && axis !== 'y' ) {
		// Width changes...
		label = `${ width }`;
		if ( showPx ) {
			label = `${ label } PX`;
		}
	}

	return label;
}
