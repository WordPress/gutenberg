let currentHandler;

function loadScript() {
	if ( currentHandler ) {
		document.removeEventListener( 'DOMContentLoaded', currentHandler );
		currentHandler = undefined;
	}

	const originalAddEventListener = document.addEventListener.bind( document );
	document.addEventListener = ( type, handler, ...rest ) => {
		if ( type === 'DOMContentLoaded' ) {
			currentHandler = handler;
		}
		originalAddEventListener( type, handler, ...rest );
	};

	jest.resetModules();
	const viewModule = require( '../view.js' );

	document.addEventListener = originalAddEventListener;

	document.dispatchEvent(
		new Event( 'DOMContentLoaded', { bubbles: true, cancelable: true } )
	);

	return viewModule;
}

function buildCountdownMarkup( { dataset = {}, innerBlocksHtml = '' } = {} ) {
	document.body.innerHTML = `
		<div
			class="wp-block-countdown"
			data-end-time="${ dataset.endTime || '' }"
			data-show-days="${ dataset.showDays ?? 'true' }"
			data-show-hours="${ dataset.showHours ?? 'true' }"
			data-show-minutes="${ dataset.showMinutes ?? 'true' }"
			data-show-seconds="${ dataset.showSeconds ?? 'true' }"
			data-action-on-end="${ dataset.actionOnEnd ?? 'hide' }"
			data-action-value="${ dataset.actionValue ?? '' }"
			data-has-inner-blocks="${ dataset.hasInnerBlocks ?? 'false' }"
			data-is-evergreen="${ dataset.isEvergreen ?? 'false' }"
			data-evergreen-duration="${ dataset.evergreenDuration ?? '0' }"
			data-timer-id="${ dataset.timerId ?? 'timer-1' }"
			data-inner-blocks-behavior="${ dataset.innerBlocksBehavior ?? 'revealOnEnd' }"
		>
			<div class="countdown">
				<div class="countdown-box countdown-years">
					<span class="countdown-value">0</span><small>Years</small>
				</div>
				<div class="countdown-box countdown-days">
					<span class="countdown-value">0</span><small>Days</small>
				</div>
				<div class="countdown-box countdown-hours">
					<span class="countdown-value">0</span><small>Hours</small>
				</div>
				<div class="countdown-box countdown-minutes">
					<span class="countdown-value">0</span><small>Minutes</small>
				</div>
				<div class="countdown-box countdown-seconds">
					<span class="countdown-value">0</span><small>Seconds</small>
				</div>
			</div>
			<div class="countdown-end-message" style="display:none;">Countdown Ended</div>
			${ innerBlocksHtml }
		</div>
	`;
}

describe( 'Countdown block frontend (view.js)', () => {
	const FIXED_NOW = new Date( '2025-06-15T12:00:00.000Z' ).getTime();

	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( FIXED_NOW );
		window.localStorage.clear();
	} );

	afterEach( () => {
		jest.useRealTimers();
		document.body.innerHTML = '';
	} );

	it( 'updates the visible digits every second for a fixed date timer', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 90 * 1000 ).toISOString(),
			},
		} );
		loadScript();

		const minutesValue = document.querySelector(
			'.countdown-minutes .countdown-value'
		);
		const secondsValue = document.querySelector(
			'.countdown-seconds .countdown-value'
		);

		expect( minutesValue ).toHaveTextContent( '1' );
		expect( secondsValue ).toHaveTextContent( '30' );

		jest.advanceTimersByTime( 1000 );

		expect( secondsValue ).toHaveTextContent( '29' );
	} );

	it( 'adds and removes the has ticked class when a value changes', () => {
		buildCountdownMarkup( {
			dataset: { endTime: new Date( FIXED_NOW + 5000 ).toISOString() },
		} );
		loadScript();

		const secondsBox = document.querySelector( '.countdown-seconds' );

		jest.advanceTimersByTime( 1000 );
		expect( secondsBox ).toHaveClass( 'has-ticked' );

		jest.advanceTimersByTime( 300 );
		expect( secondsBox ).not.toHaveClass( 'has-ticked' );
	} );

	it( 'does not mark a box as ticked when its value has not changed', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 3600 * 1000 ).toISOString(),
				showSeconds: 'false',
			},
		} );
		loadScript();

		const daysBox = document.querySelector( '.countdown-days' );
		jest.advanceTimersByTime( 1000 );
		expect( daysBox ).not.toHaveClass( 'has-ticked' );
	} );

	it( 'hides the years box when the remaining time is under a year', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 3600 * 1000 ).toISOString(),
			},
		} );
		loadScript();

		jest.advanceTimersByTime( 1000 );
		const yearsBox = document.querySelector( '.countdown-years' );
		expect( yearsBox ).toHaveStyle( { display: 'none' } );
	} );

	it( 'shows and updates the years box for durations over a year', () => {
		const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date(
					FIXED_NOW + twoYearsMs + 5000
				).toISOString(),
			},
		} );
		loadScript();

		jest.advanceTimersByTime( 1000 );
		const yearsBox = document.querySelector( '.countdown-years' );
		expect( yearsBox ).not.toHaveStyle( { display: 'none' } );
		expect(
			yearsBox.querySelector( '.countdown-value' )
		).toHaveTextContent( '2' );
	} );

	it( 'stops updating once the element is removed from the DOM (no crash)', () => {
		buildCountdownMarkup( {
			dataset: { endTime: new Date( FIXED_NOW + 5000 ).toISOString() },
		} );
		loadScript();

		const element = document.querySelector( '.wp-block-countdown' );
		element.remove();

		expect( () => {
			jest.advanceTimersByTime( 10000 );
		} ).not.toThrow();
	} );

	it( 'supports multiple independent countdown blocks on the same page', () => {
		buildCountdownMarkup();
		document.body.innerHTML = `
			<div class="wp-block-countdown" data-end-time="${ new Date(
				FIXED_NOW + 10000
			).toISOString() }" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false" data-is-evergreen="false" data-evergreen-duration="0" data-timer-id="block-a">
				<div class="countdown"><div class="countdown-box countdown-seconds"><span class="countdown-value">0</span></div></div>
			</div>
			<div class="wp-block-countdown" data-end-time="${ new Date(
				FIXED_NOW + 20000
			).toISOString() }" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false" data-is-evergreen="false" data-evergreen-duration="0" data-timer-id="block-b">
				<div class="countdown"><div class="countdown-box countdown-seconds"><span class="countdown-value">0</span></div></div>
			</div>
		`;
		loadScript();

		jest.advanceTimersByTime( 1000 );

		const [ blockA, blockB ] = document.querySelectorAll(
			'.wp-block-countdown'
		);
		expect(
			blockA.querySelector( '.countdown-seconds .countdown-value' )
		).toHaveTextContent( '9' );
		expect(
			blockB.querySelector( '.countdown-seconds .countdown-value' )
		).toHaveTextContent( '19' );
	} );

	it( 'adds the is-expired class and dispatches wp-countdown-ended on expiry', () => {
		buildCountdownMarkup( {
			dataset: { endTime: new Date( FIXED_NOW + 1000 ).toISOString() },
		} );
		loadScript();

		const element = document.querySelector( '.wp-block-countdown' );
		const handler = jest.fn();
		element.addEventListener( 'wp-countdown-ended', handler );

		jest.advanceTimersByTime( 2000 );

		expect( element ).toHaveClass( 'is-expired' );
		expect( handler ).toHaveBeenCalledTimes( 1 );
		expect( handler.mock.calls[ 0 ][ 0 ].detail ).toEqual(
			expect.objectContaining( { actionOnEnd: 'hide' } )
		);
	} );

	it( 'hides the countdown and reveals the message for actionOnEnd=showMessage', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				actionOnEnd: 'showMessage',
			},
		} );
		loadScript();

		jest.advanceTimersByTime( 2000 );

		expect( document.querySelector( '.countdown' ) ).toHaveStyle( {
			display: 'none',
		} );
		expect(
			document.querySelector( '.countdown-end-message' )
		).toHaveStyle( { display: 'block' } );
	} );

	it( 'redirects for actionOnEnd=redirect with a valid URL', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				actionOnEnd: 'redirect',
				actionValue: 'https://example.com/sale-ended',
			},
		} );
		const { navigation } = loadScript();
		const redirectSpy = jest
			.spyOn( navigation, 'redirect' )
			.mockImplementation( () => {} );

		jest.advanceTimersByTime( 2000 );

		expect( redirectSpy ).toHaveBeenCalledWith(
			'https://example.com/sale-ended'
		);
	} );

	it( 'does not redirect for an invalid actionValue', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				actionOnEnd: 'redirect',
				actionValue: 'not-a-url',
			},
		} );
		const { navigation } = loadScript();
		const redirectSpy = jest
			.spyOn( navigation, 'redirect' )
			.mockImplementation( () => {} );

		jest.advanceTimersByTime( 2000 );

		expect( redirectSpy ).not.toHaveBeenCalled();
	} );

	it( 'zeroes out all digits and keeps the timer visible for actionOnEnd=none', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				actionOnEnd: 'none',
			},
		} );
		loadScript();

		jest.advanceTimersByTime( 2000 );

		expect( document.querySelector( '.countdown' ) ).not.toHaveStyle( {
			display: 'none',
		} );
		[ 'days', 'hours', 'minutes', 'seconds' ].forEach( ( unit ) => {
			expect(
				document.querySelector(
					`.countdown-${ unit } .countdown-value`
				)
			).toHaveTextContent( '0' );
		} );
	} );

	it( 'stops the interval after expiry (no further tick side effects)', () => {
		buildCountdownMarkup( {
			dataset: { endTime: new Date( FIXED_NOW + 1000 ).toISOString() },
		} );
		loadScript();

		const element = document.querySelector( '.wp-block-countdown' );
		const handler = jest.fn();
		element.addEventListener( 'wp-countdown-ended', handler );

		jest.advanceTimersByTime( 2000 );
		expect( handler ).toHaveBeenCalledTimes( 1 );

		// Advancing well past expiry should not fire the event again.
		jest.advanceTimersByTime( 60000 );
		expect( handler ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reloads the page once when a fixed date timer with inner blocks first expires', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				hasInnerBlocks: 'true',
				actionOnEnd: 'redirect',
				actionValue: 'https://example.com',
			},
			innerBlocksHtml:
				'<div class="countdown-inner-blocks">Buy now</div>',
		} );
		const { navigation } = loadScript();
		const reloadSpy = jest
			.spyOn( navigation, 'reload' )
			.mockImplementation( () => {} );
		const redirectSpy = jest
			.spyOn( navigation, 'redirect' )
			.mockImplementation( () => {} );

		jest.advanceTimersByTime( 2000 );

		expect( reloadSpy ).toHaveBeenCalledTimes( 1 );
		expect( redirectSpy ).not.toHaveBeenCalled();
	} );

	it( 'toggles inner block visibility client-side for evergreen timers instead of reloading', () => {
		buildCountdownMarkup( {
			dataset: {
				isEvergreen: 'true',
				evergreenDuration: '1',
				hasInnerBlocks: 'true',
				timerId: 'evergreen-inner-test',
				innerBlocksBehavior: 'revealOnEnd',
			},
			innerBlocksHtml:
				'<div class="countdown-inner-blocks" style="display:none;">Buy now</div>',
		} );
		loadScript();

		jest.advanceTimersByTime( 1500 );

		const innerBlocksEl = document.querySelector(
			'.countdown-inner-blocks'
		);
		expect( innerBlocksEl ).toHaveStyle( { display: 'block' } );
	} );

	it( 'hides inner blocks client-side for evergreen + hideOnEnd timers', () => {
		buildCountdownMarkup( {
			dataset: {
				isEvergreen: 'true',
				evergreenDuration: '1',
				hasInnerBlocks: 'true',
				timerId: 'evergreen-hide-test',
				innerBlocksBehavior: 'hideOnEnd',
			},
			innerBlocksHtml:
				'<div class="countdown-inner-blocks countdown-inner-blocks--hide-on-end">Early bird</div>',
		} );
		loadScript();

		jest.advanceTimersByTime( 1500 );

		const innerBlocksEl = document.querySelector(
			'.countdown-inner-blocks'
		);
		expect( innerBlocksEl ).toHaveStyle( { display: 'none' } );
	} );

	it( 'stamps and stores an end time on first visit for an evergreen timer', () => {
		buildCountdownMarkup( {
			dataset: {
				isEvergreen: 'true',
				evergreenDuration: '600',
				timerId: 'evergreen-first-visit',
			},
		} );
		loadScript();

		const stored = window.localStorage.getItem( 'evergreen-first-visit' );
		expect( stored ).not.toBeNull();
		expect( new Date( stored ).getTime() ).toBe( FIXED_NOW + 600 * 1000 );
	} );

	it( 'resumes the same personal countdown on a repeat visit', () => {
		const previouslyStoredEnd = new Date(
			FIXED_NOW + 120 * 1000
		).toISOString();
		window.localStorage.setItem(
			'evergreen-returning-visit',
			previouslyStoredEnd
		);

		buildCountdownMarkup( {
			dataset: {
				isEvergreen: 'true',
				evergreenDuration: '600',
				timerId: 'evergreen-returning-visit',
			},
		} );
		loadScript();

		const minutesValue = document.querySelector(
			'.countdown-minutes .countdown-value'
		);
		expect( minutesValue ).toHaveTextContent( '2' );

		expect(
			window.localStorage.getItem( 'evergreen-returning-visit' )
		).toBe( previouslyStoredEnd );
	} );

	it( 'gives two different evergreen timers on the same page independent end times', () => {
		buildCountdownMarkup();
		document.body.innerHTML = `
			<div class="wp-block-countdown" data-is-evergreen="true" data-evergreen-duration="300" data-timer-id="evergreen-a" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false">
				<div class="countdown"><div class="countdown-box countdown-minutes"><span class="countdown-value">0</span></div></div>
			</div>
			<div class="wp-block-countdown" data-is-evergreen="true" data-evergreen-duration="600" data-timer-id="evergreen-b" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false">
				<div class="countdown"><div class="countdown-box countdown-minutes"><span class="countdown-value">0</span></div></div>
			</div>
		`;
		loadScript();

		expect( window.localStorage.getItem( 'evergreen-a' ) ).not.toBe(
			window.localStorage.getItem( 'evergreen-b' )
		);

		const [ blockA, blockB ] = document.querySelectorAll(
			'.wp-block-countdown'
		);
		expect(
			blockA.querySelector( '.countdown-minutes .countdown-value' )
		).toHaveTextContent( '5' );
		expect(
			blockB.querySelector( '.countdown-minutes .countdown-value' )
		).toHaveTextContent( '10' );
	} );

	it( 'dispatches wp-countdown-ended with the correct actionValue for redirect', () => {
		buildCountdownMarkup( {
			dataset: {
				endTime: new Date( FIXED_NOW + 1000 ).toISOString(),
				actionOnEnd: 'redirect',
				actionValue: 'https://example.com/sale-ended',
			},
		} );
		const { navigation } = loadScript();
		jest.spyOn( navigation, 'redirect' ).mockImplementation( () => {} );

		const element = document.querySelector( '.wp-block-countdown' );
		const handler = jest.fn();
		element.addEventListener( 'wp-countdown-ended', handler );

		jest.advanceTimersByTime( 2000 );

		expect( handler ).toHaveBeenCalledTimes( 1 );
		expect( handler.mock.calls[ 0 ][ 0 ].detail ).toEqual(
			expect.objectContaining( {
				actionOnEnd: 'redirect',
				actionValue: 'https://example.com/sale-ended',
			} )
		);
	} );

	it( 'includes a valid ISO endTime string in the event detail', () => {
		const endTimeIso = new Date( FIXED_NOW + 1000 ).toISOString();
		buildCountdownMarkup( { dataset: { endTime: endTimeIso } } );
		loadScript();

		const element = document.querySelector( '.wp-block-countdown' );
		const handler = jest.fn();
		element.addEventListener( 'wp-countdown-ended', handler );

		jest.advanceTimersByTime( 2000 );

		expect( handler.mock.calls[ 0 ][ 0 ].detail.endTime ).toBe(
			endTimeIso
		);
	} );

	it( 'bubbles so a document level listener can catch it, but only from the block that actually expired', () => {
		buildCountdownMarkup();
		document.body.innerHTML = `
			<div class="wp-block-countdown" data-end-time="${ new Date(
				FIXED_NOW + 1000
			).toISOString() }" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false" data-is-evergreen="false" data-evergreen-duration="0" data-timer-id="block-expiring">
				<div class="countdown"><div class="countdown-box countdown-seconds"><span class="countdown-value">0</span></div></div>
			</div>
			<div class="wp-block-countdown" data-end-time="${ new Date(
				FIXED_NOW + 60000
			).toISOString() }" data-show-days="true" data-show-hours="true" data-show-minutes="true" data-show-seconds="true" data-action-on-end="hide" data-action-value="" data-has-inner-blocks="false" data-is-evergreen="false" data-evergreen-duration="0" data-timer-id="block-not-expiring">
				<div class="countdown"><div class="countdown-box countdown-seconds"><span class="countdown-value">0</span></div></div>
			</div>
		`;
		loadScript();

		const docHandler = jest.fn();
		document.addEventListener( 'wp-countdown-ended', docHandler );

		jest.advanceTimersByTime( 2000 );

		expect( docHandler ).toHaveBeenCalledTimes( 1 );
		expect( docHandler.mock.calls[ 0 ][ 0 ].target.dataset.timerId ).toBe(
			'block-expiring'
		);

		document.removeEventListener( 'wp-countdown-ended', docHandler );
	} );
} );
