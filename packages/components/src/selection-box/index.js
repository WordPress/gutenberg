/**
 * External dependencies
 */
import { clamp } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { rgba, color } from '../utils/style-mixins';

function SelectionBox( {
	boundariesElement = window,
	containerElement,
	isVisible,
} ) {
	const [ positionStart, setPositionStart ] = useState( {
		x: 0,
		y: 0,
	} );
	const [ positionEnd, setPositionEnd ] = useState( {
		x: 0,
		y: 0,
	} );
	const [ isDrawing, setIsDrawing ] = useState( false );
	const boundariesNodeRef = useRef( getBoundingElement( boundariesElement ) );
	const containerNodeRef = useRef( getBoundingElement( containerElement ) );
	const nodeRef = useRef();

	const lastScrollCoords = useRef( { top: 0, left: 0 } );
	const lastPositionEnd = useRef( positionEnd );

	useEffect( () => {
		boundariesNodeRef.current = getBoundingElement( boundariesElement );
	}, [ boundariesElement ] );

	useEffect( () => {
		containerNodeRef.current = containerElement
			? getBoundingElement( containerElement )
			: nodeRef.current.parentElement;
	}, [ containerElement ] );

	useEffect( () => {
		if ( isVisible !== undefined ) {
			setIsDrawing( isVisible );
		}
	}, [ isVisible ] );

	useEffect( () => {
		const handleOnMouseDown = ( event ) => {
			const nextScrollTop = boundariesNodeRef.current?.scrollTop || 0;
			const nextScrollLeft = boundariesNodeRef.current?.scrollLeft || 0;
			const offsetTop = containerNodeRef.current?.offsetTop || 0;
			const offsetLeft = containerNodeRef.current?.offsetLeft || 0;

			const nextX = event.clientX + nextScrollLeft;
			const nextY = event.clientY + nextScrollTop;

			const nextPositionEnd = {
				x: nextX - offsetLeft,
				y: nextY - offsetTop,
			};

			setPositionStart( nextPositionEnd );
			setPositionEnd( nextPositionEnd );
			lastPositionEnd.current = nextPositionEnd;

			if ( isVisible === undefined ) {
				setIsDrawing( true );
			}
		};

		const handleOnMouseUp = () => {
			setIsDrawing( false );
		};

		const handleOnMouseMove = ( event ) => {
			if ( ! isDrawing ) return;

			const nextScrollTop = boundariesNodeRef.current?.scrollTop || 0;
			const nextScrollLeft = boundariesNodeRef.current?.scrollLeft || 0;

			const offsetTop = containerNodeRef.current?.offsetTop || 0;
			const offsetLeft = containerNodeRef.current?.offsetLeft || 0;

			const nextX = event.clientX + nextScrollLeft - offsetLeft;
			const nextY = event.clientY + nextScrollTop - offsetTop;

			const nextPositionEnd = {
				x: nextX,
				y: nextY,
			};

			setPositionEnd( nextPositionEnd );
			lastPositionEnd.current = nextPositionEnd;
		};

		const handleOnScroll = ( event ) => {
			if ( ! isDrawing ) return;

			const { top: prevTop, left: prevLeft } = lastScrollCoords.current;
			const { x, y } = lastPositionEnd.current;

			const nextTop = event.target.scrollTop;
			const nextLeft = event.target.scrollLeft;

			const nextScrollTop = nextTop - prevTop;
			const nextScrollLeft = nextLeft - prevLeft;

			const nextX = x + nextScrollLeft;
			const nextY = y + nextScrollTop;

			const nextPositionEnd = {
				x: nextX,
				y: nextY,
			};

			setPositionEnd( nextPositionEnd );

			lastPositionEnd.current = nextPositionEnd;
			lastScrollCoords.current = {
				top: nextTop,
				left: nextLeft,
			};
		};

		window.addEventListener( 'mousedown', handleOnMouseDown );
		document.addEventListener( 'mousemove', handleOnMouseMove );
		window.addEventListener( 'mouseup', handleOnMouseUp );

		if ( boundariesNodeRef.current ) {
			boundariesNodeRef.current.addEventListener(
				'mouseup',
				handleOnMouseUp
			);
			boundariesNodeRef.current.addEventListener(
				'scroll',
				handleOnScroll
			);
		}

		return () => {
			window.removeEventListener( 'mousedown', handleOnMouseDown );
			document.removeEventListener( 'mousemove', handleOnMouseMove );
			window.removeEventListener( 'mouseup', handleOnMouseUp );

			if ( boundariesNodeRef.current ) {
				boundariesNodeRef.current.removeEventListener(
					'mouseup',
					handleOnMouseUp
				);
				boundariesNodeRef.current.removeEventListener(
					'scroll',
					handleOnScroll
				);
			}
		};
	}, [ isDrawing, isVisible ] );

	const box = getBoxClientRect( {
		maxWidth: getBoundingElementMaxWidth( boundariesNodeRef.current ),
		maxHeight: getBoundingElementMaxHeight( boundariesNodeRef.current ),
		startX: positionStart.x,
		startY: positionStart.y,
		endX: positionEnd.x,
		endY: positionEnd.y,
	} );

	const style = {
		backgroundColor: rgba( color( 'ui.borderFocus' ), 0.2 ),
		border: '1px solid',
		borderColor: rgba( color( 'ui.borderFocus' ), 0.8 ),
		display: isDrawing ? 'block' : 'none',
		height: box.height,
		left: 0,
		opacity: 0.5,
		pointerEvents: 'none',
		position: 'absolute',
		top: 0,
		transform: `translate3d(${ box.left }px, ${ box.top }px, 0)`,
		width: box.width,
		willChange: 'width, height, transform',
		zIndex: 99999,
	};

	return <div style={ style } ref={ nodeRef } />;
}

function getBoundingElement( selector = window ) {
	if ( typeof selector === 'string' ) {
		return document.querySelector( selector );
	}

	if ( typeof selector === 'object' ) {
		if ( selector.current ) {
			return selector.current;
		}
		if ( selector === window || selector instanceof window.HTMLElement ) {
			return selector;
		}
	}

	return undefined;
}

function getBoundingElementMaxWidth( node ) {
	return node?.innerWidth || node?.scrollWidth;
}

function getBoundingElementMaxHeight( node ) {
	return node?.innerHeight || node?.scrollHeight;
}

function getBoxClientRect( {
	maxWidth,
	maxHeight,
	startX,
	startY,
	endX,
	endY,
} ) {
	const isXPositive = endX > startX;
	const isYPositive = endY > startY;

	let left = isXPositive ? startX : endX;
	let top = isYPositive ? startY : endY;

	let width = isXPositive ? endX - startX : startX - endX;
	let height = isYPositive ? endY - startY : startY - endY;

	let widthLimit = maxWidth;
	let heightLimit = maxHeight;

	if ( ! isXPositive && widthLimit ) {
		widthLimit = startX;
	} else {
		widthLimit = widthLimit - left;
	}

	if ( ! isYPositive && heightLimit ) {
		heightLimit = startY;
	} else {
		heightLimit = heightLimit - top;
	}

	width = widthLimit ? clamp( width, 0, widthLimit ) : width;
	height = heightLimit ? clamp( height, 0, heightLimit ) : height;

	if ( width === widthLimit && ! isXPositive ) {
		left = 0;
	}
	if ( height === heightLimit && ! isYPositive ) {
		top = 0;
	}

	return {
		top,
		left,
		width,
		height,
	};
}

export default SelectionBox;
