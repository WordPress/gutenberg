import clsx from 'clsx';
import { useEffect, useRef } from '@wordpress/element';
import { __experimentalUseDragging as useDragging } from '@wordpress/compose';
import { clamp } from '../utils/math';
import styles from './style.module.scss';
import type { WordPressComponentProps } from '../context';
import type { AngleCircleProps } from './types';

type UseDraggingArgumentType = Parameters< typeof useDragging >[ 0 ];
type UseDraggingCallbackEvent =
	| Parameters< NonNullable< UseDraggingArgumentType[ 'onDragStart' ] > >[ 0 ]
	| Parameters< NonNullable< UseDraggingArgumentType[ 'onDragMove' ] > >[ 0 ]
	| Parameters< NonNullable< UseDraggingArgumentType[ 'onDragEnd' ] > >[ 0 ];

function AngleCircle( {
	value,
	min = 0,
	max = 360,
	onChange,
	className,
	...props
}: WordPressComponentProps< AngleCircleProps, 'div' > ) {
	const angleCircleRef = useRef< HTMLDivElement >( null );
	const angleCircleCenterRef = useRef< { x: number; y: number } >(
		undefined
	);
	const previousCursorValueRef =
		useRef< CSSStyleDeclaration[ 'cursor' ] >( undefined );
	// Read during a drag instead of `value`, which can lag between events.
	const dragStateRef = useRef< {
		lastPointerAngle: number;
		unclampedValue: number;
	} >( undefined );
	// The default range keeps reporting the raw dial angle, as it always has.
	const isDefaultRange = min === 0 && max === 360;

	const setAngleCircleCenter = () => {
		if ( angleCircleRef.current === null ) {
			return;
		}

		const rect = angleCircleRef.current.getBoundingClientRect();
		angleCircleCenterRef.current = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
	};

	const capturePointerAngle = ( event: UseDraggingCallbackEvent ) => {
		if ( event === undefined ) {
			return undefined;
		}

		// Prevent (drag) mouse events from selecting and accidentally
		// triggering actions from other elements.
		event.preventDefault();
		// Input control needs to lose focus and by preventDefault above, it doesn't.
		( event.target as HTMLDivElement | null )?.focus();

		if ( angleCircleCenterRef.current === undefined ) {
			return undefined;
		}

		const { x: centerX, y: centerY } = angleCircleCenterRef.current;
		return getAngle( centerX, centerY, event.clientX, event.clientY );
	};

	const startTurn = ( event: UseDraggingCallbackEvent ) => {
		const angle = capturePointerAngle( event );
		if ( angle === undefined || onChange === undefined ) {
			return;
		}

		if ( isDefaultRange ) {
			onChange( angle );
			return;
		}

		const currentValue = Number( value );
		const reference =
			value !== '' && Number.isFinite( currentValue )
				? clamp( currentValue, min, max )
				: clamp( 0, min, max );
		const unclampedValue = getNearestEquivalent( angle, reference );
		dragStateRef.current = { lastPointerAngle: angle, unclampedValue };
		onChange( clamp( unclampedValue, min, max ) );
	};

	const continueTurn = ( event: UseDraggingCallbackEvent ) => {
		const angle = capturePointerAngle( event );
		if ( angle === undefined || onChange === undefined ) {
			return;
		}

		if ( isDefaultRange ) {
			onChange( angle );
			return;
		}

		if ( dragStateRef.current === undefined ) {
			return;
		}

		// Between two events the pointer is taken to have turned the short
		// way round, so a fast flick of more than half a turn reverses.
		const unclampedValue =
			dragStateRef.current.unclampedValue +
			getNearestEquivalent(
				angle - dragStateRef.current.lastPointerAngle,
				0
			);
		dragStateRef.current = { lastPointerAngle: angle, unclampedValue };
		onChange( clamp( unclampedValue, min, max ) );
	};

	const { startDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			setAngleCircleCenter();
			startTurn( event );
		},
		onDragMove: continueTurn,
		onDragEnd: ( event ) => {
			continueTurn( event );
			dragStateRef.current = undefined;
		},
	} );

	useEffect( () => {
		if ( isDragging ) {
			if ( previousCursorValueRef.current === undefined ) {
				previousCursorValueRef.current = document.body.style.cursor;
			}
			document.body.style.cursor = 'grabbing';
		} else {
			document.body.style.cursor = previousCursorValueRef.current || '';
			previousCursorValueRef.current = undefined;
		}
	}, [ isDragging ] );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			ref={ angleCircleRef }
			onMouseDown={ startDrag }
			className={ clsx(
				'components-angle-picker-control__angle-circle',
				styles[ 'circle-root' ],
				className
			) }
			{ ...props }
		>
			{ value !== undefined && (
				<div
					style={
						value
							? { transform: `rotate(${ value }deg)` }
							: undefined
					}
					className={ clsx(
						'components-angle-picker-control__angle-circle-indicator-wrapper',
						styles[ 'circle-indicator-wrapper' ]
					) }
					tabIndex={ -1 }
				>
					<div
						className={ clsx(
							'components-angle-picker-control__angle-circle-indicator',
							styles[ 'circle-indicator' ]
						) }
					/>
				</div>
			) }
		</div>
	);
}

function getAngle(
	centerX: number,
	centerY: number,
	pointX: number,
	pointY: number
) {
	const y = pointY - centerY;
	const x = pointX - centerX;

	const angleInRadians = Math.atan2( y, x );
	const angleInDeg = Math.round( angleInRadians * ( 180 / Math.PI ) ) + 90;
	if ( angleInDeg < 0 ) {
		return 360 + angleInDeg;
	}
	return angleInDeg;
}

/**
 * Returns the angle that points the same way as `angle` and is closest to
 * `reference`.
 *
 * @param angle     An angle in degrees.
 * @param reference The angle in degrees to stay close to.
 */
function getNearestEquivalent( angle: number, reference: number ) {
	return angle + 360 * Math.round( ( reference - angle ) / 360 );
}

export default AngleCircle;
