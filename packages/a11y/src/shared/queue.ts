const CLEAR_FILL_DELAY = 100;
const ANNOUNCE_WAIT = 1500;

const politeQueue: string[] = [];
let isDraining = false;

function drainNext(): void {
	if ( politeQueue.length === 0 ) {
		isDraining = false;
		return;
	}

	const message = politeQueue.shift()!;
	const containerPolite = document.getElementById( 'a11y-speak-polite' );

	if ( containerPolite ) {
		containerPolite.textContent = '';
	}

	setTimeout( () => {
		const polite = document.getElementById( 'a11y-speak-polite' );
		const introText = document.getElementById( 'a11y-speak-intro-text' );

		if ( polite ) {
			polite.textContent = message;
		}

		if ( introText ) {
			introText.removeAttribute( 'hidden' );
		}

		setTimeout( drainNext, ANNOUNCE_WAIT );
	}, CLEAR_FILL_DELAY );
}

export function enqueuePolite( message: string ): void {
	politeQueue.push( message );
	if ( ! isDraining ) {
		isDraining = true;
		drainNext();
	}
}

/**
 * Reset queue state. Intended for test teardown only.
 */
export function resetQueue(): void {
	politeQueue.length = 0;
	isDraining = false;
}
