/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import type { ResizeHandleRenderProps } from '@wordpress/grid';

/**
 * Internal dependencies
 */
import styles from './widget-resize-handle.module.css';

/**
 * Rounded L-shaped resize affordance for the widget dashboard. Passed to
 * `DashboardGrid` via `renderResizeHandle` so the grid keeps gesture wiring.
 *
 * @param props Props from `DashboardGrid` / `ResizeHandle`.
 */
export function WidgetResizeHandle( props: ResizeHandleRenderProps ) {
	const { ref, listeners, attributes, verticalResizable, isResizing } = props;
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
}
