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
	isVisible = true,
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

	const lastScrollCoords = useRef( { top: 0, left: 0 } );
	const lastPositionEnd = useRef( positionEnd );

	useEffect( () => {
		boundariesNodeRef.current = getBoundingElement( boundariesElement );
	}, [ boundariesElement ] );

	useEffect( () => {
		containerNodeRef.current = getBoundingElement( containerElement );
	}, [ containerElement ] );

	useEffect( () => {
		setIsDrawing( isVisible );
	}, [ isVisible ] );

	useEffect( () => {
		const handleOnMouseDown = ( event ) => {
			const nextScrollTop = boundariesNodeRef.current?.scrollTop || 0;
			const nextScrollLeft = boundariesNodeRef.current?.scrollLeft || 0;
			const offsetTop = containerNodeRef.current?.offsetTop || 0;
			const offsetLeft = containerNodeRef.current?.offsetLeft || 0;

			const nextX = event.clientX + nextScrollLeft;
			const nextY = event.clientY + nextScrollTop;

			setPositionStart( {
				x: nextX - offsetLeft,
				y: nextY - offsetTop,
			} );

			const nextPositionEnd = {
				x: nextX,
				y: nextY,
			};

			// setIsDrawing( true );
			setPositionEnd( nextPositionEnd );
			lastPositionEnd.current = nextPositionEnd;
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

			const offsetTop = containerNodeRef.current?.offsetTop || 0;
			const offsetLeft = containerNodeRef.current?.offsetLeft || 0;

			const nextX = x + nextScrollLeft - offsetLeft;
			const nextY = y + nextScrollTop - offsetTop;

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

		document.addEventListener( 'mousedown', handleOnMouseDown );
		document.addEventListener( 'mouseup', handleOnMouseUp );
		document.addEventListener( 'mousemove', handleOnMouseMove );

		if ( boundariesNodeRef.current ) {
			boundariesNodeRef.current.addEventListener(
				'scroll',
				handleOnScroll
			);
		}

		return () => {
			document.removeEventListener( 'mousedown', handleOnMouseDown );
			document.removeEventListener( 'mouseup', handleOnMouseUp );
			document.removeEventListener( 'mousemove', handleOnMouseMove );

			if ( boundariesNodeRef.current ) {
				boundariesNodeRef.current.removeEventListener(
					'scroll',
					handleOnScroll
				);
			}
		};
	}, [ isDrawing, isVisible ] );

	if ( ! isVisible || ! isDrawing ) return null;

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

	return <div style={ style } />;
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

	const left = isXPositive ? startX : endX;
	const top = isYPositive ? startY : endY;

	let width = isXPositive ? endX - startX : startX - endX;
	let height = isYPositive ? endY - startY : startY - endY;

	width = maxWidth ? clamp( width, 0, maxWidth - left ) : width;
	height = maxHeight ? clamp( height, 0, maxHeight - top ) : height;

	return {
		top,
		left,
		width,
		height,
	};
}

export default SelectionBox;
