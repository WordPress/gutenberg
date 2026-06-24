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
 * Default edit-mode overlay: one column per track, each holding `rows`
 * row-marker tiles when `rowHeight` is uniform. Used by both surfaces
 * and replaceable via `renderGridOverlay`. Reveals with a diagonal
 * wave on activate and releases paint cost while inactive.
 *
 * @param props           Render props supplied by the surface.
 * @param props.columns   Column tracks to mirror.
 * @param props.rowHeight Uniform row height in pixels; omitted for
 *                        content-sized rows, which skip row markers.
 * @param props.rows      Row tracks per column; omitted when unknown.
 * @param props.isActive  When `false`, the overlay fades out.
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
