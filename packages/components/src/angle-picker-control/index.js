/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import {
	useInstanceId,
	__experimentalUseDragging as useDragging,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';

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

const AngleCircle = ( { value, onChange, ...props } ) => {
	const angleCircleRef = useRef();
	const angleCircleCenter = useRef();

	const setAngleCircleCenter = () => {
		const rect = angleCircleRef.current.getBoundingClientRect();
		angleCircleCenter.current = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2,
		};
	};

	const changeAngleToPosition = ( event ) => {
		const { x: centerX, y: centerY } = angleCircleCenter.current;
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
	return (
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		<div
			ref={ angleCircleRef }
			onMouseDown={ startDrag }
			className="components-angle-picker-control__angle-circle"
			style={ isDragging ? { cursor: 'grabbing' } : undefined }
			{ ...props }
		>
			<div
				style={
					value ? { transform: `rotate(${ value }deg)` } : undefined
				}
				className="components-angle-picker-control__angle-circle-indicator-wrapper"
			>
				<span className="components-angle-picker-control__angle-circle-indicator" />
			</div>
		</div>
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	);
};

export default function AnglePickerControl( {
	value,
	onChange,
	label = __( 'Angle' ),
} ) {
	const instanceId = useInstanceId( AnglePickerControl );
	const inputId = `components-angle-picker-control__input-${ instanceId }`;
	return (
		<BaseControl
			label={ label }
			id={ inputId }
			className="components-angle-picker-control"
		>
			<AngleCircle
				value={ value }
				onChange={ onChange }
				aria-hidden="true"
			/>
			<input
				className="components-angle-picker-control__input-field"
				type="number"
				id={ inputId }
				onChange={ ( event ) => {
					const unprocessedValue = event.target.value;
					const inputValue =
						unprocessedValue !== ''
							? parseInt( event.target.value, 10 )
							: 0;
					onChange( inputValue );
				} }
				value={ value }
				min={ 0 }
				max={ 360 }
				step="1"
			/>
		</BaseControl>
	);
}
