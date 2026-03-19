/**
 * Shared WaveSurfer configuration utilities for the playlist block.
 * Used by both the frontend (view.js) and editor (edit.js).
 */

// WaveSurfer configuration constants
export const WAVEFORM_HEIGHT = 80;
export const WAVEFORM_BAR_WIDTH = 2;
export const WAVEFORM_BAR_GAP = 2;
export const WAVEFORM_BAR_RADIUS = 0;
export const WAVEFORM_CURSOR_WIDTH = 2;
export const WAVEFORM_OPACITY = 0.5;
export const TRACK_CHANGE_DELAY_MS = 1000;

/**
 * Creates the base WaveSurfer configuration shared between editor and frontend.
 *
 * @return {Object} Base WaveSurfer configuration options.
 */
export function getBaseWaveSurferConfig() {
	return {
		barWidth: WAVEFORM_BAR_WIDTH,
		barRadius: WAVEFORM_BAR_RADIUS,
		height: WAVEFORM_HEIGHT,
		barGap: WAVEFORM_BAR_GAP,
		responsive: true,
	};
}

/**
 * Creates the waveform color with reduced opacity for unplayed bars.
 *
 * @param {string} color The base color (rgb or rgba format).
 * @return {string} The color with reduced opacity.
 */
export function getWaveformColor( color ) {
	if ( color.startsWith( 'rgba' ) ) {
		return color.replace( /[\d.]+\)$/, `${ WAVEFORM_OPACITY })` );
	}
	return color
		.replace( 'rgb(', 'rgba(' )
		.replace( ')', `, ${ WAVEFORM_OPACITY })` );
}

/**
 * Creates WaveSurfer configuration for the main player waveform.
 *
 * @param {HTMLElement} container       The container element for the waveform.
 * @param {string}      color           The base color from computed styles.
 * @param {string}      backgroundColor The background color for played bars.
 * @param {boolean}     showCursor      Whether to show the cursor.
 * @return {Object} WaveSurfer configuration options.
 */
export function getPlayerWaveSurferConfig(
	container,
	color,
	backgroundColor = null,
	showCursor = true
) {
	// Progress color: use background color at 50% opacity if provided, otherwise use text color
	const progressColor = backgroundColor
		? getWaveformColor( backgroundColor )
		: color;

	return {
		...getBaseWaveSurferConfig(),
		container,
		waveColor: getWaveformColor( color ),
		progressColor,
		cursorColor: showCursor ? color : 'transparent',
		cursorWidth: showCursor ? WAVEFORM_CURSOR_WIDTH : 0,
	};
}

/**
 * Creates WaveSurfer configuration for the hover preview waveform.
 *
 * @param {HTMLElement} container       The container element for the waveform.
 * @param {string}      color           The base color from computed styles.
 * @param {string}      backgroundColor The background color for played bars on hover.
 * @return {Object} WaveSurfer configuration options.
 */
export function getHoverWaveSurferConfig(
	container,
	color,
	backgroundColor = null
) {
	return {
		...getBaseWaveSurferConfig(),
		container,
		waveColor: color,
		// Use background color at full opacity for played portion on hover
		progressColor: backgroundColor || color,
		cursorColor: 'transparent',
		cursorWidth: 0,
	};
}
