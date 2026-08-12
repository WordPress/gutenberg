export const navigation = {
	redirect( url ) {
		window.location.assign( url );
	},
	reload() {
		window.location.reload();
	},
};

function isValidRedirectUrl( url ) {
	if ( ! url ) {
		return false;
	}

	try {
		const parsed = new URL( url );
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const countdownElements = document.querySelectorAll(
		'.wp-block-countdown'
	);

	countdownElements.forEach( ( element ) => {
		const isEvergreen = element.dataset.isEvergreen === 'true';
		const timerId = element.dataset.timerId;
		const evergreenDuration = parseInt(
			element.dataset.evergreenDuration,
			10
		);
		const innerBlocksBehavior =
			element.dataset.innerBlocksBehavior || 'revealOnEnd';

		let endTime;

		if ( isEvergreen ) {
			const storedEndTime = localStorage.getItem( timerId );
			if ( storedEndTime ) {
				endTime = new Date( storedEndTime );
			} else {
				endTime = new Date( Date.now() + evergreenDuration * 1000 );
				localStorage.setItem( timerId, endTime.toISOString() );
			}
		} else {
			endTime = new Date( element.dataset.endTime );
		}

		const showDays = element.dataset.showDays === 'true';
		const showHours = element.dataset.showHours === 'true';
		const showMinutes = element.dataset.showMinutes === 'true';
		const showSeconds = element.dataset.showSeconds === 'true';
		const actionOnEnd = element.dataset.actionOnEnd;
		const actionValue = element.dataset.actionValue;
		const hasInnerBlocks = element.dataset.hasInnerBlocks === 'true';

		const countdownEl = element.querySelector( '.countdown' );
		const endMessageEl = element.querySelector( '.countdown-end-message' );

		const innerBlocksEl = element.querySelector(
			'.countdown-inner-blocks'
		);

		const setBoxValue = ( boxClassName, value ) => {
			const box = element.querySelector( boxClassName );
			if ( box ) {
				const valSpan = box.querySelector( '.countdown-value' );
				if ( valSpan && valSpan.textContent !== String( value ) ) {
					valSpan.textContent = value;
					box.classList.add( 'has-ticked' );
					setTimeout(
						() => box.classList.remove( 'has-ticked' ),
						300
					);
				}
			}
		};

		const finish = () => {
			clearInterval( interval );
			const wasAlreadyExpired =
				element.classList.contains( 'is-expired' );

			element.classList.add( 'is-expired' );
			element.dispatchEvent(
				new CustomEvent( 'wp-countdown-ended', {
					bubbles: true,
					detail: {
						endTime: endTime.toISOString(),
						actionOnEnd,
						actionValue,
					},
				} )
			);

			if ( hasInnerBlocks && ! isEvergreen && ! wasAlreadyExpired ) {
				navigation.reload();
				return;
			}

			if ( hasInnerBlocks && isEvergreen && innerBlocksEl ) {
				if ( innerBlocksBehavior === 'hideOnEnd' ) {
					innerBlocksEl.style.display = 'none';
				} else {
					innerBlocksEl.style.display = 'block';
				}
			}

			if ( actionOnEnd === 'none' ) {
				setBoxValue( '.countdown-years', 0 );
				setBoxValue( '.countdown-days', 0 );
				setBoxValue( '.countdown-hours', 0 );
				setBoxValue( '.countdown-minutes', 0 );
				setBoxValue( '.countdown-seconds', 0 );
				return;
			}

			if ( actionOnEnd === 'hide' ) {
				const innerStillVisible =
					innerBlocksEl && innerBlocksEl.style.display !== 'none';
				if ( ! innerStillVisible ) {
					element.style.display = 'none';
				}
				return;
			}

			if ( countdownEl ) {
				countdownEl.style.display = 'none';
			}

			if ( actionOnEnd === 'redirect' ) {
				if ( isValidRedirectUrl( actionValue ) ) {
					navigation.redirect( actionValue );
				}
				return;
			}

			if ( actionOnEnd === 'showMessage' && endMessageEl ) {
				endMessageEl.style.display = 'block';
			}
		};

		const updateCountdown = () => {
			if ( ! document.body.contains( element ) ) {
				clearInterval( interval );
				return;
			}

			const now = new Date();
			const difference = endTime - now;

			if ( difference <= 0 || element.dataset.serverExpired === 'true' ) {
				finish();
				return;
			}

			const totalSeconds = Math.floor( difference / 1000 );
			const totalMinutes = Math.floor( totalSeconds / 60 );
			const totalHours = Math.floor( totalMinutes / 60 );
			const totalDays = Math.floor( totalHours / 24 );

			const years = Math.floor( totalDays / 365 );
			const days = years > 0 ? totalDays % 365 : totalDays;
			const hours = showDays ? totalHours % 24 : totalHours;
			const minutes =
				showHours || showDays ? totalMinutes % 60 : totalMinutes;
			const seconds =
				showMinutes || showHours || showDays
					? totalSeconds % 60
					: totalSeconds;

			const yearsBox = element.querySelector( '.countdown-years' );
			if ( yearsBox ) {
				if ( years <= 0 ) {
					yearsBox.style.display = 'none';
				} else {
					setBoxValue( '.countdown-years', years );
				}
			}

			if ( showDays ) {
				setBoxValue( '.countdown-days', days );
			}
			if ( showHours ) {
				setBoxValue( '.countdown-hours', hours );
			}
			if ( showMinutes ) {
				setBoxValue( '.countdown-minutes', minutes );
			}
			if ( showSeconds ) {
				setBoxValue( '.countdown-seconds', seconds );
			}
		};

		const interval = setInterval( updateCountdown, 1000 );
		updateCountdown();
	} );
} );
