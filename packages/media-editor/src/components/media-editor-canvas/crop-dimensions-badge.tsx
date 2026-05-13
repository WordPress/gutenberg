/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { getSourceRegion } from '../../image-editor';
import type { CropperState } from '../../image-editor';

/**
 * Format the badge text.
 *
 * @param width  Output crop width in source pixels.
 * @param height Output crop height in source pixels.
 */
export function formatBadgeText( width: number, height: number ): string {
	return `${ Math.round( width ) } × ${ Math.round( height ) }`;
}

export interface CropDimensionsBadgeProps {
	state: CropperState;
	visible: boolean;
}

/**
 * Overlay badge that shows the live output dimensions of the current crop.
 * Mirrors Chrome devtools' viewport size indicator — fixed corner, ignored
 * by pointer events, surfaced only during cropper interaction.
 *
 * @param props
 * @param props.state   Current cropper state from the controller.
 * @param props.visible Whether the badge should be displayed.
 */
export default function CropDimensionsBadge( {
	state,
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

	const text = formatBadgeText( region.width, region.height );

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
