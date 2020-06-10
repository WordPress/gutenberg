/**
 * External dependencies
 */
import classnames from 'classnames';
import { Resizable } from 're-resizable';
import useResizeAware from 'react-resize-aware';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

function ResizableBox( {
	children,
	className,
	showHandle = true,
	showVisualizers = true,
	...props
} ) {
	// Removes the inline styles in the drag handles.
	const handleStylesOverrides = {
		width: null,
		height: null,
		top: null,
		right: null,
		bottom: null,
		left: null,
	};

	const handleClassName = 'components-resizable-box__handle';
	const sideHandleClassName = 'components-resizable-box__side-handle';
	const cornerHandleClassName = 'components-resizable-box__corner-handle';

	return (
		<Resizable
			className={ classnames(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			handleClasses={ {
				top: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-top'
				),
				right: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-right'
				),
				bottom: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-bottom'
				),
				left: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-left'
				),
				topLeft: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-top',
					'components-resizable-box__handle-left'
				),
				topRight: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-top',
					'components-resizable-box__handle-right'
				),
				bottomRight: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-bottom',
					'components-resizable-box__handle-right'
				),
				bottomLeft: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-bottom',
					'components-resizable-box__handle-left'
				),
			} }
			handleStyles={ {
				top: handleStylesOverrides,
				right: handleStylesOverrides,
				bottom: handleStylesOverrides,
				left: handleStylesOverrides,
				topLeft: handleStylesOverrides,
				topRight: handleStylesOverrides,
				bottomRight: handleStylesOverrides,
				bottomLeft: handleStylesOverrides,
			} }
			{ ...props }
		>
			<Visualizer showVisualizers={ showVisualizers } />
			{ children }
		</Resizable>
	);
}

function Visualizer( { showVisualizers = false } ) {
	const [ resizeListener, sizes ] = useResizeAware();
	const [ tooltipPosition, setTooltipPosition ] = useState( {} );
	const [ isRendered, setIsRendered ] = useState( false );
	const [ direction, setDirection ] = useState( '' );
	const [ isActive, setIsActive ] = useState( false );
	const { width, height } = sizes;
	const tooltipRef = useRef();
	const widthRef = useRef( width );
	const heightRef = useRef( height );

	const tooltipAnimationsActive = isActive;

	useEffect( () => {
		if ( width !== null && height !== null && ! isRendered ) {
			setIsRendered( true );
			heightRef.current = height;
			widthRef.current = width;
		}
	}, [ width, height, isRendered ] );

	useEffect( () => {
		if ( ! isRendered ) return;
		const didWidthChange = width !== widthRef.current;
		const didHeightChange = height !== heightRef.current;

		let nextDirection = '';

		if ( didWidthChange && didHeightChange ) {
			nextDirection = 'both';
		} else if ( didWidthChange ) {
			nextDirection = 'width';
		} else if ( didHeightChange ) {
			nextDirection = 'height';
		}

		setDirection( nextDirection );
	}, [ width, height, isRendered ] );

	useEffect( () => {
		const unsetActiveState = () => {
			setIsActive( false );
		};

		const updateTooltipPosition = ( event ) => {
			if ( ! isRendered ) return;

			if ( width !== widthRef.current || height !== heightRef.current ) {
				setTooltipPosition( { x: event.clientX, y: event.clientY } );
				widthRef.current = width;
				heightRef.current = height;
				setIsActive( true );
				return;
			}

			if ( event.which !== 1 ) {
				setIsActive( false );
			}
		};

		window.addEventListener( 'mousemove', updateTooltipPosition );
		window.addEventListener( 'mousedown', unsetActiveState );
		window.addEventListener( 'mouseup', unsetActiveState );

		return () => {
			window.removeEventListener( 'mousemove', updateTooltipPosition );
			window.removeEventListener( 'mouseup', unsetActiveState );
			window.removeEventListener( 'mousedown', unsetActiveState );
		};
	}, [ width, height, isRendered ] );

	if ( ! showVisualizers ) return null;

	const tooltipStyle = {
		transform: `translate(${
			tooltipPosition.x - tooltipRef.current?.clientWidth / 2
		}px, ${ tooltipPosition.y - tooltipRef.current?.clientHeight - 12 }px)`,
	};

	let label;
	if ( direction === 'both' ) {
		label = `${ width } x ${ height }`;
	}
	if ( direction === 'width' ) {
		label = `${ width }PX`;
	}
	if ( direction === 'height' ) {
		label = `${ height }PX`;
	}

	return (
		<VisualizerView>
			{ resizeListener }
			<VisualizerYLabelWrapperView
				ref={ tooltipRef }
				isActive={ tooltipAnimationsActive }
				style={ tooltipStyle }
			>
				<VisualizerLabelView>{ label }</VisualizerLabelView>
			</VisualizerYLabelWrapperView>
			<br />
		</VisualizerView>
	);
}

const VisualizerView = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	pointer-events: none;
	z-index: 1000;
`;

const VisualizerYLabelWrapperView = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	pointer-events: none;
	transition: opacity 120ms linear;

	${ ( { isActive } ) =>
		isActive &&
		`
		opacity: 1;
	` }
`;

const VisualizerLabelView = styled.div`
	padding: 2px 4px;
	background: rgba( 0, 0, 0, 0.4 );
	font-size: 13px;
	color: white;
	border-radius: 4px;
`;

export default ResizableBox;
