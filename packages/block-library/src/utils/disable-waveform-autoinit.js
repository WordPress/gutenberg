const AUTOINIT_ATTRIBUTE = 'data-waveform-autoinit';

let documentElement;
let hadAutoinitAttribute = false;
let previousAutoinitValue;

if ( typeof document !== 'undefined' ) {
	documentElement = document.documentElement;
	hadAutoinitAttribute = documentElement.hasAttribute( AUTOINIT_ATTRIBUTE );
	previousAutoinitValue = documentElement.getAttribute( AUTOINIT_ATTRIBUTE );

	// The waveform player checks this during module evaluation, before callers
	// can run code just before constructing an instance.
	documentElement.setAttribute( AUTOINIT_ATTRIBUTE, 'false' );
}

export function restoreWaveformAutoinitAttribute() {
	if ( ! documentElement ) {
		return;
	}

	if ( hadAutoinitAttribute ) {
		documentElement.setAttribute(
			AUTOINIT_ATTRIBUTE,
			previousAutoinitValue
		);
	} else {
		documentElement.removeAttribute( AUTOINIT_ATTRIBUTE );
	}
}
