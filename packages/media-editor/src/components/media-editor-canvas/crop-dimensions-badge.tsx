/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { getSourceRegion } from '../../image-editor';
import type { CropperState } from '../../image-editor';

const RATIO_LABELS: ReadonlyArray< { value: number; label: string } > = [
	{ value: 1, label: '1:1' },
	{ value: 16 / 9, label: '16:9' },
	{ value: 9 / 16, label: '9:16' },
	{ value: 4 / 3, label: '4:3' },
	{ value: 3 / 4, label: '3:4' },
	{ value: 3 / 2, label: '3:2' },
	{ value: 2 / 3, label: '2:3' },
];

// Floats from divisions like 16/9 don't round-trip exactly, so we match on
// proximity rather than equality. 1e-3 comfortably distinguishes neighbors
// (e.g. 4:3 = 1.333… vs 3:2 = 1.5) while absorbing UI-side rounding.
const RATIO_EPSILON = 1e-3;

function formatRatioLabel( aspectRatio: number ): string | null {
	for ( const { value, label } of RATIO_LABELS ) {
		if ( Math.abs( aspectRatio - value ) < RATIO_EPSILON ) {
			return label;
		}
	}
	return null;
}

/**
 * Format the badge text. `aspectRatio` is the cropper's pixel-space ratio
 * prop; only known presets get a trailing label, free / custom ratios show
 * dimensions alone.
 *
 * @param width       Output crop width in source pixels.
 * @param height      Output crop height in source pixels.
 * @param aspectRatio Optional fixed aspect ratio (width / height).
 */
export function formatBadgeText(
	width: number,
	height: number,
	aspectRatio?: number
): string {
	const dims = `${ Math.round( width ) } × ${ Math.round( height ) }`;
	if ( ! aspectRatio || aspectRatio <= 0 ) {
		return dims;
	}
	const ratio = formatRatioLabel( aspectRatio );
	return ratio ? `${ dims } · ${ ratio }` : dims;
}

export interface CropDimensionsBadgeProps {
	state: CropperState;
	aspectRatio?: number;
	visible: boolean;
}

/**
 * Overlay badge that shows the live output dimensions of the current crop.
 * Mirrors Chrome devtools' viewport size indicator — fixed corner, ignored
 * by pointer events, surfaced only during cropper interaction.
 *
 * @param props
 * @param props.state       Current cropper state from the controller.
 * @param props.aspectRatio Active aspect-ratio constraint (width / height).
 * @param props.visible     Whether the badge should be displayed.
 */
export default function CropDimensionsBadge( {
	state,
	aspectRatio,
	visible,
}: CropDimensionsBadgeProps ) {
	if ( ! state.image ) {
		return null;
	}

	const region = getSourceRegion( state, {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	} );

	if ( region.width <= 0 || region.height <= 0 ) {
		return null;
	}

	const text = formatBadgeText( region.width, region.height, aspectRatio );

	return (
		<div
			className={ clsx( 'media-editor-canvas__dimensions-badge', {
				'is-visible': visible,
			} ) }
			aria-hidden="true"
		>
			{ text }
		</div>
	);
}
