/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import type { GridOverlayRenderProps } from './types';
import { getSpacingTokenVar } from './spacing';
import styles from './grid-overlay.module.css';

/**
 * Default edit-mode overlay. Paints diagonal stripes behind the tiles
 * to mark the dashboard surface, plus dashed outlines on each column
 * track and (when `rowHeight` is supplied) repeating dividers for the
 * row tracks.
 *
 * Used by both `DashboardGrid` and `DashboardLanes`. Replaced wholesale
 * by passing a `renderGridOverlay` to either surface; themed in place
 * via the CSS custom properties documented in the package README.
 *
 * Cross-fades in and out on `isActive` toggles via a CSS opacity
 * transition; while inactive, `visibility: hidden` releases paint cost.
 *
 * @param props           Render props supplied by the surface.
 * @param props.columns   Number of column tracks to mirror.
 * @param props.spacing   Gap size key from the design-system scale.
 *                        Emitted as `--wpds-dimension-gap-{size}` so the
 *                        overlay follows the active density.
 * @param props.rowHeight Row height in pixels for surfaces with uniform
 *                        rows. Omitted on lane surfaces or auto-sized
 *                        grids; in that case row dividers are skipped.
 * @param props.isActive  When `false`, the overlay fades out and stops
 *                        consuming paint cost.
 */
export function GridOverlay( {
	columns,
	spacing,
	rowHeight,
	isActive,
}: GridOverlayRenderProps ) {
	const showRows = typeof rowHeight === 'number';
	const gapVar = getSpacingTokenVar( spacing );
	// `--wp-grid-overlay-row-height` and `--wp-grid-overlay-row-tile`
	// drive the row-divider stops so the CSS file stays static while
	// the values come from the live grid.
	const style: React.CSSProperties = {
		gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
		gap: gapVar,
		...( showRows
			? ( {
					'--wp-grid-overlay-row-height': `${ rowHeight }px`,
					'--wp-grid-overlay-row-tile': `calc(${ rowHeight }px + ${ gapVar })`,
			  } as React.CSSProperties )
			: {} ),
	};

	return (
		<div
			aria-hidden
			className={ clsx(
				styles.overlay,
				isActive && styles[ 'is-active' ],
				showRows && styles[ 'has-rows' ]
			) }
			style={ style }
		>
			{ Array.from( { length: columns } ).map( ( _, i ) => (
				<div key={ i } className={ styles.column } />
			) ) }
		</div>
	);
}
