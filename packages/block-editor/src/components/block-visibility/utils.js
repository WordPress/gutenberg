/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Labels for viewport types.
 */
export const VIEWPORT_LABELS = {
	Desktop: __( 'Desktop' ),
	Tablet: __( 'Tablet' ),
	Mobile: __( 'Mobile' ),
};

/**
 * Check if block is hidden for a specific viewport.
 *
 * @param {Object|boolean|undefined} blockVisibility Block visibility attribute.
 * @param {string}                   viewportType    Current viewport type.
 * @return {boolean} Whether the block is hidden for the viewport.
 */
export function isHiddenForViewport( blockVisibility, viewportType ) {
	if ( blockVisibility === false ) {
		return true;
	}
	if (
		typeof blockVisibility === 'object' &&
		blockVisibility?.[ viewportType.toLowerCase() ] === false
	) {
		return true;
	}
	return false;
}

/**
 * Check if block has any visibility settings.
 *
 * @param {Object|boolean|undefined} blockVisibility Block visibility attribute.
 * @return {boolean} Whether the block has any visibility settings.
 */
export function hasAnyVisibilitySettings( blockVisibility ) {
	if ( blockVisibility === false ) {
		return true;
	}
	if ( typeof blockVisibility === 'object' ) {
		return Object.values( blockVisibility ).some(
			( value ) => value === false
		);
	}
	return false;
}

/**
 * Calculate new visibility when toggling for a specific viewport.
 *
 * @param {Object|boolean|undefined} currentVisibility Current block visibility.
 * @param {string}                   viewportType      Viewport to toggle.
 * @param {boolean}                  isCurrentlyHidden Whether currently hidden.
 * @return {Object|boolean|undefined} New visibility value.
 */
export function getToggledVisibility(
	currentVisibility,
	viewportType,
	isCurrentlyHidden
) {
	const viewportKey = viewportType.toLowerCase();

	if ( isCurrentlyHidden ) {
		// Show block on this viewport
		if ( currentVisibility === false ) {
			// Was hidden everywhere, now show only on this viewport
			const visibility = {
				desktop: viewportKey === 'desktop' ? undefined : false,
				tablet: viewportKey === 'tablet' ? undefined : false,
				mobile: viewportKey === 'mobile' ? undefined : false,
			};
			// Clean up undefined values
			return Object.fromEntries(
				Object.entries( visibility ).filter(
					( [ , value ] ) => value !== undefined
				)
			);
		}
		if ( typeof currentVisibility === 'object' ) {
			const { [ viewportKey ]: removed, ...rest } = currentVisibility;
			return Object.keys( rest ).length > 0 ? rest : undefined;
		}
		return undefined;
	}

	// Hide block on this viewport
	const newVisibility =
		typeof currentVisibility === 'object'
			? { ...currentVisibility, [ viewportKey ]: false }
			: { [ viewportKey ]: false };

	// If all viewports are hidden, simplify to false
	if (
		newVisibility.desktop === false &&
		newVisibility.tablet === false &&
		newVisibility.mobile === false
	) {
		return false;
	}

	return newVisibility;
}
