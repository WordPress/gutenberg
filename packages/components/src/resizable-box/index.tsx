/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import clsx from 'clsx';
import { Resizable } from 're-resizable';
import type { ResizableProps } from 're-resizable';
import type { ReactNode, ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import ResizeTooltip from './resize-tooltip';

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

// Removes the inline styles in the drag handles.
const HANDLE_STYLES_OVERRIDES = {
	width: undefined,
	height: undefined,
	top: undefined,
	right: undefined,
	bottom: undefined,
	left: undefined,
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

type ResizableBoxProps = ResizableProps & {
	children: ReactNode;
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
): JSX.Element {
	return (
		<Resizable
			className={ clsx(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			handleClasses={ HANDLE_CLASSES }
			handleStyles={ HANDLE_STYLES }
			ref={ ref }
			{ ...props }
		>
			{ children }
			{ showTooltip && <ResizeTooltip { ...tooltipProps } /> }
		</Resizable>
	);
}

export const ResizableBox = forwardRef( UnforwardedResizableBox );

export default ResizableBox;
