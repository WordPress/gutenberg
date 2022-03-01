/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __experimentalUseDragging as useDragging } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	CircleRoot,
	CircleIndicatorWrapper,
	CircleIndicator,
} from './styles/angle-picker-control-styles';

function AngleCircle( { value, onChange, ...props } ) {
	const angleCircleRef = useRef();
	const angleCircleCenter = useRef();
	const previousCursorValue = useRef();

	const setAngleCircleCenter = () => {
		const rect = angleCircleRef.current.getBoundingClientRect();
		angleCircleCenter.current = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
	};

	const changeAngleToPosition = ( event ) => {
		const { x: centerX, y: centerY } = angleCircleCenter.current;
		const { ownerDocument } = angleCircleRef.current;
		// Prevent (drag) mouse events from selecting and accidentally
		// triggering actions from other elements.
		event.preventDefault();
		// Ensure the input isn't focused as preventDefault would leave it.
		ownerDocument.activeElement.blur();
		onChange( getAngle( centerX, centerY, event.clientX, event.clientY ) );
	};

	const { startDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			setAngleCircleCenter();
			changeAngleToPosition( event );
		},
		onDragMove: changeAngleToPosition,
		onDragEnd: changeAngleToPosition,
	} );

	useEffect( () => {
		if ( isDragging ) {
			if ( previousCursorValue.current === undefined ) {
				previousCursorValue.current = document.body.style.cursor;
			}
			document.body.style.cursor = 'grabbing';
		} else {
			document.body.style.cursor = previousCursorValue.current || null;
			previousCursorValue.current = undefined;
		}
	}, [ isDragging ] );

	return (
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		<CircleRoot
			ref={ angleCircleRef }
			onMouseDown={ startDrag }
			className="components-angle-picker-control__angle-circle"
			style={ isDragging ? { cursor: 'grabbing' } : undefined }
			{ ...props }
		>
			<CircleIndicatorWrapper
				style={
					value ? { transform: `rotate(${ value }deg)` } : undefined
				}
				className="components-angle-picker-control__angle-circle-indicator-wrapper"
			>
				<CircleIndicator className="components-angle-picker-control__angle-circle-indicator" />
			</CircleIndicatorWrapper>
		</CircleRoot>
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	);
}

function getAngle( centerX, centerY, pointX, pointY ) {
	const y = pointY - centerY;
	const x = pointX - centerX;

	const angleInRadians = Math.atan2( y, x );
	const angleInDeg = Math.round( angleInRadians * ( 180 / Math.PI ) ) + 90;
	if ( angleInDeg < 0 ) {
		return 360 + angleInDeg;
	}
	return angleInDeg;
}

export default AngleCircle;
