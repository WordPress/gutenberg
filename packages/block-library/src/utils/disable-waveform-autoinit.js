/**
 * Opts the document out of the waveform player's document-wide scan for
 * `[data-waveform-player]`. Separate module because imports are hoisted: the
 * dependency reads this attribute while its own module is evaluated.
 */

const AUTO_INIT_ATTRIBUTE = 'data-waveform-autoinit';

const documentElement =
	typeof document === 'undefined' ? undefined : document.documentElement;
const previousValue = documentElement?.getAttribute( AUTO_INIT_ATTRIBUTE );

documentElement?.setAttribute( AUTO_INIT_ATTRIBUTE, 'false' );

/**
 * Restores the value the document carried before the opt-out was applied.
 *
 * The opt-out is page-global, so leaving it in place would suppress declarative
 * players belonging to other plugins.
 */
export function restoreWaveformAutoInit() {
	if ( ! documentElement ) {
		return;
	}

	if ( previousValue === null ) {
		documentElement.removeAttribute( AUTO_INIT_ATTRIBUTE );
		return;
	}

	documentElement.setAttribute( AUTO_INIT_ATTRIBUTE, previousValue );
}
