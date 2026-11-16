import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { Resizable } from 're-resizable';
import type { ResizableProps } from 're-resizable';
import type { ForwardedRef } from 'react';
import ResizeTooltip from './resize-tooltip';
import { getScreenTransform, toLocalDelta } from './utils';

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

// Measures pointer movement along the box's own axes, so a handle on a
// rotated or scaled block resizes the way it faces on screen.
class TransformAwareResizable extends Resizable {
	calculateNewSizeFromDirection( clientX: number, clientY: number ) {
		const { original } = this.state;
		// An explicit `scale` prop already corrects the movement.
		if ( ! this.resizable || ( this.props.scale ?? 1 ) !== 1 ) {
			return super.calculateNewSizeFromDirection( clientX, clientY );
		}
		const local = toLocalDelta(
			getScreenTransform( this.resizable ),
			clientX - original.x,
			clientY - original.y
		);
		return super.calculateNewSizeFromDirection(
			original.x + local.x,
			original.y + local.y
		);
	}
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
			handleStyles={ HANDLE_STYLES }
			ref={ ref }
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
