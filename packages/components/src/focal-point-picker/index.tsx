/**
 * External dependencies
 */
import clsx from 'clsx';

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
import type { WordPressComponentProps } from '../context/wordpress-component';
import type {
	FocalPoint as FocalPointType,
	FocalPointPickerProps,
} from './types';
import type { KeyboardEventHandler } from 'react';

const GRID_OVERLAY_TIMEOUT = 600;

/**
 * Focal Point Picker is a component which creates a UI for identifying the most important visual point of an image.
 *
 * This component addresses a specific problem: with large background images it is common to see undesirable crops,
 * especially when viewing on smaller viewports such as mobile phones. This component allows the selection of
 * the point with the most important visual information and returns it as a pair of numbers between 0 and 1.
 * This value can be easily converted into the CSS `background-position` attribute, and will ensure that the
 * focal point is never cropped out, regardless of viewport.
 *
 * - Example focal point picker value: `{ x: 0.5, y: 0.1 }`
 * - Corresponding CSS: `background-position: 50% 10%;`
 *
 * ```jsx
 * import { FocalPointPicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 * 	const [ focalPoint, setFocalPoint ] = useState( {
 * 		x: 0.5,
 * 		y: 0.5,
 * 	} );
 *
 * 	const url = '/path/to/image';
 *
 * 	// Example function to render the CSS styles based on Focal Point Picker value
 * 	const style = {
 * 		backgroundImage: `url(${ url })`,
 * 		backgroundPosition: `${ focalPoint.x * 100 }% ${ focalPoint.y * 100 }%`,
 * 	};
 *
 * 	return (
 * 		<>
 * 			<FocalPointPicker
 * 				url={ url }
 * 				value={ focalPoint }
 * 				onDragStart={ setFocalPoint }
 * 				onDrag={ setFocalPoint }
 * 				onChange={ setFocalPoint }
 * 			/>
 * 			<div style={ style } />
 * 		</>
 * 	);
 * };
 * ```
 */
export function FocalPointPicker( {
	__nextHasNoMarginBottom,
	__next40pxDefaultSize = false,
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
	...restProps
}: WordPressComponentProps< FocalPointPickerProps, 'div', false > ) {
	const [ point, setPoint ] = useState( valueProp );
	const [ showGridOverlay, setShowGridOverlay ] = useState( false );

	const { startDrag, endDrag, isDragging } = useDragging( {
		onDragStart: ( event ) => {
			dragAreaRef.current?.focus();
			const value = getValueWithinDragArea( event );

			// `value` can technically be undefined if getValueWithinDragArea() is
			// called before dragAreaRef is set, but this shouldn't happen in reality.
			if ( ! value ) {
				return;
			}

			onDragStart?.( value, event );
			setPoint( value );
		},
		onDragMove: ( event ) => {
			// Prevents text-selection when dragging.
			event.preventDefault();
			const value = getValueWithinDragArea( event );
			if ( ! value ) {
				return;
			}
			onDrag?.( value, event );
			setPoint( value );
		},
		onDragEnd: () => {
			onDragEnd?.();
			onChange?.( point );
		},
	} );

	// Uses the internal point while dragging or else the value from props.
	const { x, y } = isDragging ? point : valueProp;

	const dragAreaRef = useRef< HTMLDivElement >( null );
	const [ bounds, setBounds ] = useState( INITIAL_BOUNDS );
	const refUpdateBounds = useRef( () => {
		if ( ! dragAreaRef.current ) {
			return;
		}

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
		if ( ! dragAreaRef.current ) {
			return;
		}

		const { defaultView } = dragAreaRef.current.ownerDocument;
		defaultView?.addEventListener( 'resize', updateBounds );
		return () => defaultView?.removeEventListener( 'resize', updateBounds );
	}, [] );

	// Updates the bounds to cover cases of unspecified media or load failures.
	useIsomorphicLayoutEffect( () => void refUpdateBounds.current(), [] );

	// TODO: Consider refactoring getValueWithinDragArea() into a pure function.
	// https://github.com/WordPress/gutenberg/pull/43872#discussion_r963455173
	const getValueWithinDragArea = ( {
		clientX,
		clientY,
		shiftKey,
	}: {
		clientX: number;
		clientY: number;
		shiftKey: boolean;
	} ) => {
		if ( ! dragAreaRef.current ) {
			return;
		}

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

	const getFinalValue = ( value: FocalPointType ): FocalPointType => {
		const resolvedValue = resolvePoint?.( value ) ?? value;
		resolvedValue.x = Math.max( 0, Math.min( resolvedValue.x, 1 ) );
		resolvedValue.y = Math.max( 0, Math.min( resolvedValue.y, 1 ) );
		const roundToTwoDecimalPlaces = ( n: number ) =>
			Math.round( n * 1e2 ) / 1e2;

		return {
			x: roundToTwoDecimalPlaces( resolvedValue.x ),
			y: roundToTwoDecimalPlaces( resolvedValue.y ),
		};
	};

	const arrowKeyStep: KeyboardEventHandler< HTMLDivElement > = ( event ) => {
		const { code, shiftKey } = event;
		if (
			! [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].includes(
				code
			)
		) {
			return;
		}

		event.preventDefault();
		const value = { x, y };
		const step = shiftKey ? 0.1 : 0.01;
		const delta =
			code === 'ArrowUp' || code === 'ArrowLeft' ? -1 * step : step;
		const axis = code === 'ArrowUp' || code === 'ArrowDown' ? 'y' : 'x';
		value[ axis ] = value[ axis ] + delta;
		onChange?.( getFinalValue( value ) );
	};

	const focalPointPosition = {
		left: x !== undefined ? x * bounds.width : 0.5 * bounds.width,
		top: y !== undefined ? y * bounds.height : 0.5 * bounds.height,
	};

	const classes = clsx( 'components-focal-point-picker-control', className );

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
			{ ...restProps }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
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
						if ( isDragging ) {
							endDrag();
						}
					} }
					ref={ dragAreaRef }
					role="button"
					tabIndex={ -1 }
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
				__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
				__next40pxDefaultSize={ __next40pxDefaultSize }
				hasHelpText={ !! help }
				point={ { x, y } }
				onChange={ ( value ) => {
					onChange?.( getFinalValue( value ) );
				} }
			/>
		</BaseControl>
	);
}

export default FocalPointPicker;
