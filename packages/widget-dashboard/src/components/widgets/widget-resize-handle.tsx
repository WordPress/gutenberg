/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import type { ResizeHandleRenderProps } from '@wordpress/grid';

/**
 * Internal dependencies
 */
import styles from './widget-resize-handle.module.css';

type WidgetResizeHandleProps = Omit< ResizeHandleRenderProps, 'ref' >;

/**
 * Rounded L-shaped resize affordance for the widget dashboard. Passed to
 * `DashboardGrid` via `renderResizeHandle` so the grid keeps gesture wiring.
 *
 * Uses `forwardRef` because the grid attaches dnd-kit's merged node ref via
 * the JSX `ref` attribute, not as a regular prop.
 */
export const WidgetResizeHandle = forwardRef<
	HTMLDivElement,
	WidgetResizeHandleProps
>( function WidgetResizeHandle(
	{ listeners, attributes, verticalResizable, isResizing },
	ref
) {
	if ( ! verticalResizable ) {
		return (
			<div
				ref={ ref }
				className={ clsx(
					styles.handle,
					styles.handleHorizontal,
					isResizing && styles.resizing
				) }
				{ ...listeners }
				{ ...attributes }
			></div>
		);
	}

	return (
		<div
			ref={ ref }
			className={ clsx(
				styles.handle,
				styles.handleCorner,
				isResizing && styles.resizing
			) }
			{ ...listeners }
			{ ...attributes }
		></div>
	);
} );
