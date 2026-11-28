import { useMergeRefs } from '@wordpress/compose';
import {
	forwardRef,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import clsx from 'clsx';
import type { Resizable, ResizableProps } from 're-resizable';
import type { ForwardedRef, RefObject } from 'react';
import ResizeTooltip from './resize-tooltip';
import { TransformAwareResizable } from './transform-aware-resizable';
import {
	getViewportVectorTransform,
	getTransformedHandleStyles,
} from './utils';
import type { LinearTransform } from './utils';

const HANDLE_CLASS_NAME = 'components-resizable-box__handle';
const SIDE_HANDLE_CLASS_NAME = 'components-resizable-box__side-handle';
const CORNER_HANDLE_CLASS_NAME = 'components-resizable-box__corner-handle';

const HANDLE_CLASSES = {
	top: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top'
	),
	right: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-right'
	),
	bottom: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom'
	),
	left: clsx(
		HANDLE_CLASS_NAME,
		SIDE_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-left'
	),
	topLeft: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-left'
	),
	topRight: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-top',
		'components-resizable-box__handle-right'
	),
	bottomRight: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-right'
	),
	bottomLeft: clsx(
		HANDLE_CLASS_NAME,
		CORNER_HANDLE_CLASS_NAME,
		'components-resizable-box__handle-bottom',
		'components-resizable-box__handle-left'
	),
};

// Removes the inline styles in the drag handles, so the stylesheet controls
// their size, position, and stacking.
const HANDLE_STYLES_OVERRIDES = {
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
	zIndex: undefined,
};
const HANDLE_STYLES = {
	top: HANDLE_STYLES_OVERRIDES,
	right: HANDLE_STYLES_OVERRIDES,
	bottom: HANDLE_STYLES_OVERRIDES,
	left: HANDLE_STYLES_OVERRIDES,
	topLeft: HANDLE_STYLES_OVERRIDES,
	topRight: HANDLE_STYLES_OVERRIDES,
	bottomRight: HANDLE_STYLES_OVERRIDES,
	bottomLeft: HANDLE_STYLES_OVERRIDES,
};

function isSameTransform( m: LinearTransform, n: LinearTransform ) {
	return (
		Math.abs( m.a - n.a ) < 1e-6 &&
		Math.abs( m.b - n.b ) < 1e-6 &&
		Math.abs( m.c - n.c ) < 1e-6 &&
		Math.abs( m.d - n.d ) < 1e-6
	);
}

function useHandleStyles(
	resizableRef: RefObject< Resizable | null >,
	showHandle: boolean
) {
	const [ matrix, setMatrix ] = useState< LinearTransform >( {
		a: 1,
		b: 0,
		c: 0,
		d: 1,
	} );
	// A transform is a style, not a prop, so read it after every render.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useLayoutEffect( () => {
		// Consumers re-render on every move during a drag.
		if ( ! showHandle || resizableRef.current?.state.isResizing ) {
			return;
		}
		const element = resizableRef.current?.resizable;
		if ( ! element ) {
			return;
		}
		const next = getViewportVectorTransform( element );
		setMatrix( ( current ) =>
			isSameTransform( current, next ) ? current : next
		);
	} );
	return useMemo( () => {
		const transformed = getTransformedHandleStyles( matrix );
		if ( ! transformed ) {
			return HANDLE_STYLES;
		}
		return Object.fromEntries(
			Object.entries( HANDLE_STYLES ).map( ( [ direction, style ] ) => [
				direction,
				{
					...style,
					...transformed[ direction as keyof typeof transformed ],
				},
			] )
		);
	}, [ matrix ] );
}

type ResizableBoxProps = ResizableProps & {
	showHandle?: boolean;
	__experimentalShowTooltip?: boolean;
	__experimentalTooltipProps?: Parameters< typeof ResizeTooltip >[ 0 ];
};

function UnforwardedResizableBox(
	{
		className,
		children,
		showHandle = true,
		__experimentalShowTooltip: showTooltip = false,
		__experimentalTooltipProps: tooltipProps = {},
		...props
	}: ResizableBoxProps,
	ref: ForwardedRef< Resizable >
) {
	const resizableRef = useRef< Resizable >( null );
	const mergedRef = useMergeRefs( [ ref, resizableRef ] );
	const handleStyles = useHandleStyles( resizableRef, showHandle );
	return (
		<TransformAwareResizable
			className={ clsx(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			// Add a focusable element within the drag handle. Unfortunately,
			// `re-resizable` does not make them properly focusable by default,
			// causing focus to move the block wrapper which triggers block
			// drag.
			handleComponent={ Object.fromEntries(
				Object.keys( HANDLE_CLASSES ).map( ( key ) => [
					key,
					<div key={ key } tabIndex={ -1 } />,
				] )
			) }
			handleClasses={ HANDLE_CLASSES }
			handleStyles={ handleStyles }
			ref={ mergedRef }
			{ ...props }
		>
			{ children }
			{ showTooltip && <ResizeTooltip { ...tooltipProps } /> }
		</TransformAwareResizable>
	);
}

/**
 * `ResizableBox` wraps content in a container with draggable handles, letting
 * users interactively resize it along one or more edges or corners.
 */
export const ResizableBox = forwardRef( UnforwardedResizableBox );
ResizableBox.displayName = 'ResizableBox';

export default ResizableBox;
