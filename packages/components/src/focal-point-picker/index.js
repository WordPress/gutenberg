/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	__experimentalUseDragging as useDragging,
	useInstanceId,
	useIsomorphicLayoutEffect,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import Controls from './controls';
import FocalPoint from './focal-point';
import Grid from './grid';
import Media from './media';
import {
	MediaWrapper,
	MediaContainer,
} from './styles/focal-point-picker-style';
import { INITIAL_BOUNDS } from './utils';
import { useUpdateEffect } from '../utils/hooks';

const GRID_OVERLAY_TIMEOUT = 600;

export default function FocalPointPicker( {
	autoPlay = true,
	className,
	help,
	label,
	onChange,
	onDrag,
	onDragEnd,
	onDragStart,
	resolvePoint,
	url,
	value: valueProp = {
		x: 0.5,
		y: 0.5,
	},
} ) {
	const [ point, setPoint ] = useState( valueProp );
	const [ showGridOverlay, setShowGridOverlay ] = useState( false );

	const { startDrag, endDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			dragAreaRef.current.focus();
			const value = getValueWithinDragArea( event );
			onDragStart?.( value, event );
			setPoint( value );
		},
		onDragMove: ( event ) => {
			// Prevents text-selection when dragging.
			event.preventDefault();
			const value = getValueWithinDragArea( event );
			onDrag?.( value, event );
			setPoint( value );
		},
		onDragEnd: ( event ) => {
			onDragEnd?.( event );
			onChange?.( point );
		},
	} );

	// Uses the internal point while dragging or else the value from props.
	const { x, y } = isDragging ? point : valueProp;

	const dragAreaRef = useRef();
	const [ bounds, setBounds ] = useState( INITIAL_BOUNDS );
	const refUpdateBounds = useRef( () => {
		const { clientWidth: width, clientHeight: height } =
			dragAreaRef.current;
		// Falls back to initial bounds if the ref has no size. Since styles
		// give the drag area dimensions even when the media has not loaded
		// this should only happen in unit tests (jsdom).
		setBounds(
			width > 0 && height > 0 ? { width, height } : { ...INITIAL_BOUNDS }
		);
	} );

	useEffect( () => {
		const updateBounds = refUpdateBounds.current;
		const { defaultView } = dragAreaRef.current.ownerDocument;
		defaultView.addEventListener( 'resize', updateBounds );
		return () => defaultView.removeEventListener( 'resize', updateBounds );
	}, [] );

	// Updates the bounds to cover cases of unspecified media or load failures.
	useIsomorphicLayoutEffect( () => void refUpdateBounds.current(), [] );

	const getValueWithinDragArea = ( { clientX, clientY, shiftKey } ) => {
		const { top, left } = dragAreaRef.current.getBoundingClientRect();
		let nextX = ( clientX - left ) / bounds.width;
		let nextY = ( clientY - top ) / bounds.height;
		// Enables holding shift to jump values by 10%.
		if ( shiftKey ) {
			nextX = Math.round( nextX / 0.1 ) * 0.1;
			nextY = Math.round( nextY / 0.1 ) * 0.1;
		}
		return getFinalValue( { x: nextX, y: nextY } );
	};

	const getFinalValue = ( value ) => {
		const resolvedValue = resolvePoint?.( value ) ?? value;
		resolvedValue.x = Math.max( 0, Math.min( resolvedValue.x, 1 ) );
		resolvedValue.y = Math.max( 0, Math.min( resolvedValue.y, 1 ) );
		return {
			x: parseFloat( resolvedValue.x ).toFixed( 2 ),
			y: parseFloat( resolvedValue.y ).toFixed( 2 ),
		};
	};

	const arrowKeyStep = ( event ) => {
		const { code, shiftKey } = event;
		if (
			! [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].includes(
				code
			)
		)
			return;

		event.preventDefault();
		const value = { x, y };
		const step = shiftKey ? 0.1 : 0.01;
		const delta =
			code === 'ArrowUp' || code === 'ArrowLeft' ? -1 * step : step;
		const axis = code === 'ArrowUp' || code === 'ArrowDown' ? 'y' : 'x';
		value[ axis ] = parseFloat( value[ axis ] ) + delta;
		onChange?.( getFinalValue( value ) );
	};

	const focalPointPosition = {
		left: x * bounds.width,
		top: y * bounds.height,
	};

	const classes = classnames(
		'components-focal-point-picker-control',
		className
	);

	const instanceId = useInstanceId( FocalPointPicker );
	const id = `inspector-focal-point-picker-control-${ instanceId }`;

	useUpdateEffect( () => {
		setShowGridOverlay( true );
		const timeout = window.setTimeout( () => {
			setShowGridOverlay( false );
		}, GRID_OVERLAY_TIMEOUT );

		return () => window.clearTimeout( timeout );
	}, [ x, y ] );

	return (
		<BaseControl
			label={ label }
			id={ id }
			help={ help }
			className={ classes }
		>
			<MediaWrapper className="components-focal-point-picker-wrapper">
				<MediaContainer
					className="components-focal-point-picker"
					onKeyDown={ arrowKeyStep }
					onMouseDown={ startDrag }
					onBlur={ () => {
						if ( isDragging ) endDrag();
					} }
					ref={ dragAreaRef }
					role="button"
					tabIndex="-1"
				>
					<Grid bounds={ bounds } showOverlay={ showGridOverlay } />
					<Media
						alt={ __( 'Media preview' ) }
						autoPlay={ autoPlay }
						onLoad={ refUpdateBounds.current }
						src={ url }
					/>
					<FocalPoint
						{ ...focalPointPosition }
						isDragging={ isDragging }
					/>
				</MediaContainer>
			</MediaWrapper>
			<Controls
				point={ { x, y } }
				onChange={ ( value ) => {
					onChange?.( getFinalValue( value ) );
				} }
			/>
		</BaseControl>
	);
}
