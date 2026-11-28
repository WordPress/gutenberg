export interface ContainerMetrics {
	/** Content-box width in pixels. */
	width: number;
	/** Content-box height in pixels. */
	height: number;
	/** Computed `column-gap` in pixels, or `null` when it does not parse. */
	columnGap: number | null;
}

function toPx( value: string ): number {
	const parsed = Number.parseFloat( value );
	return Number.isFinite( parsed ) ? parsed : 0;
}

/**
 * Reads a surface root's size and column gap synchronously.
 *
 * Returns the content box, the same box the ResizeObserver reports as
 * `contentRect`, so the first measurement and later observer updates
 * resolve the same column count when the root has padding or a border.
 *
 * @param node Surface root element.
 */
export function measureContainer( node: HTMLElement ): ContainerMetrics {
	const rect = node.getBoundingClientRect();
	const style = window.getComputedStyle( node );
	const columnGap = Number.parseFloat( style.columnGap );
	return {
		width: Math.max(
			0,
			rect.width -
				toPx( style.paddingLeft ) -
				toPx( style.paddingRight ) -
				toPx( style.borderLeftWidth ) -
				toPx( style.borderRightWidth )
		),
		height: Math.max(
			0,
			rect.height -
				toPx( style.paddingTop ) -
				toPx( style.paddingBottom ) -
				toPx( style.borderTopWidth ) -
				toPx( style.borderBottomWidth )
		),
		columnGap:
			Number.isFinite( columnGap ) && columnGap > 0 ? columnGap : null,
	};
}
