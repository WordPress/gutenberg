/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { GridOverlayRenderProps } from './types';
import styles from './grid-overlay.module.css';

/**
 * Default edit-mode overlay. Renders one column per track; when
 * `rowHeight` and `rows` are supplied, each column holds that many
 * row-marker tiles sized to the uniform row height.
 *
 * Used by both `DashboardGrid` and `DashboardLanes`. Replaced wholesale
 * by passing a `renderGridOverlay` to either surface; themed in place
 * via the CSS custom properties documented in the package README.
 *
 * Reveals with a diagonal alpha wave from the top-left corner when
 * `isActive` becomes true (motion design tokens for duration and
 * easing). Fades out on deactivate; while inactive, `visibility:
 * hidden` releases paint cost.
 *
 * The overlay inherits its gap from the same design-system gap token
 * the surfaces use, so columns and row markers stay pixel-aligned
 * without the surface having to forward a `spacing` value.
 *
 * @param props           Render props supplied by the surface.
 * @param props.columns   Number of column tracks to mirror.
 * @param props.rowHeight Row height in pixels for surfaces with uniform
 *                        rows. Omitted on lane surfaces or auto-sized
 *                        grids; in that case row markers are skipped.
 * @param props.rows      Number of row tracks to mirror in each column.
 *                        Omitted when row height is unknown.
 * @param props.isActive  When `false`, the overlay fades out and stops
 *                        consuming paint cost.
 */
export function GridOverlay( {
	columns,
	rowHeight,
	rows,
	isActive,
}: GridOverlayRenderProps ) {
	const showRows =
		typeof rowHeight === 'number' && typeof rows === 'number' && rows > 0;
	// Bump the key when edit mode activates so CSS animations restart on
	// each enter (the overlay stays mounted across toggles).
	const [ waveKey, setWaveKey ] = useState( 0 );
	useEffect( () => {
		if ( isActive ) {
			setWaveKey( ( key ) => key + 1 );
		}
	}, [ isActive ] );
	const style: React.CSSProperties = {
		gridTemplateColumns: `repeat(${ columns }, minmax(0, 1fr))`,
		...( showRows
			? ( {
					'--wp-grid-overlay-row-height': `${ rowHeight }px`,
			  } as React.CSSProperties )
			: {} ),
	};

	return (
		<div
			key={ waveKey }
			aria-hidden
			className={ clsx(
				styles.overlay,
				isActive && styles[ 'is-active' ],
				showRows && styles[ 'has-rows' ]
			) }
			style={ style }
		>
			{ Array.from( { length: columns }, ( _column, columnIndex ) => (
				<div
					key={ columnIndex }
					className={ styles.column }
					style={
						{
							'--wp-grid-overlay-column-index': columnIndex,
							'--wp-grid-overlay-row-index': 0,
						} as React.CSSProperties
					}
				>
					{ showRows &&
						Array.from( { length: rows }, ( _row, rowIndex ) => (
							<div
								key={ rowIndex }
								className={ styles.row }
								style={
									{
										'--wp-grid-overlay-row-index': rowIndex,
									} as React.CSSProperties
								}
							/>
						) ) }
				</div>
			) ) }
		</div>
	);
}
