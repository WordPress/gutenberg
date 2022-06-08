/**
 * External dependencies
 */
import momentLib from 'moment';

/**
 * Internal dependencies
 */
import {
	__experimentalGetSettings,
	date as dateNoI18n,
	dateI18n,
	getDate,
	gmdate,
	gmdateI18n,
	humanTimeDiff,
	isInTheFuture,
	setSettings,
} from '../';

describe( 'isInTheFuture', () => {
	it( 'should return true if the date is in the future', () => {
		// Create a Date object 1 minute in the future.
		const date = new Date( Number( getDate() ) + 1000 * 60 );

		expect( isInTheFuture( date ) ).toBe( true );
	} );

	it( 'should return false if the date is in the past', () => {
		// Create a Date object 1 minute in the past.
		const date = new Date( Number( getDate() ) - 1000 * 60 );

		expect( isInTheFuture( date ) ).toBe( false );
	} );

	it( 'should ignore the timezone', () => {
		const settings = __experimentalGetSettings();

		// Set a timezone in the future.
		setSettings( {
			...settings,
			timezone: { offset: '4', string: '' },
		} );
		// Create a Date object 1 minute in the past.
		let date = new Date( Number( getDate() ) - 1000 * 60 );
		expect( isInTheFuture( date ) ).toBe( false );

		// Create a Date object 1 minute in the future.
		date = new Date( Number( getDate() ) + 1000 * 60 );
		expect( isInTheFuture( date ) ).toBe( true );

		// Restore default settings.
		setSettings( settings );
	} );
} );

describe( 'Function date', () => {
	test.each( [
		[ 'j/n/y', '18/6/19' ],
		[ 'd/m/y', '18/06/19' ],
		[ 'D j M Y', 'Tue 18 Jun 2019' ],
		[ 'l jS F Y', 'Tuesday 18th June 2019' ],
		[ 'N w', '2 2' ],
		[ 'z', '168' ],
		[ 'W', '25' ],
		[ 't', '30' ],
		[ 'L', '0' ],
		[ 'o', '2019' ],
		[ 'g:i a', '11:00 am' ],
		[ 'h:i A', '11:00 AM' ],
		[ 'G:i:s', '11:00:00' ],
		[ 'H:i:s', '11:00:00' ],
		[ 'B', '499' ],
		[ 'u', '000000' ],
		[ 'v', '000' ],
		[ 'e I T', 'Coordinated Universal Time 0 UTC' ],
		[ 'O P Z', '+0000 +00:00 0' ],
		[ 'c', '2019-06-18T11:00:00+00:00' ],
		[ 'r', 'Tue, 18 Jun 2019 11:00:00 +0000' ],
		[ 'U', '1560855600' ],
	] )(
		'should format date as "%s", ignoring locale settings',
		( formatString, expected ) => {
			const settings = __experimentalGetSettings();

			// Simulate different locale.
			const l10n = settings.l10n;
			setSettings( {
				...settings,
				l10n: {
					...l10n,
					locale: 'es',
					months: l10n.months.map( ( month ) => `es_${ month }` ),
					monthsShort: l10n.monthsShort.map(
						( month ) => `es_${ month }`
					),
					weekdays: l10n.weekdays.map(
						( weekday ) => `es_${ weekday }`
					),
					weekdaysShort: l10n.weekdaysShort.map(
						( weekday ) => `es_${ weekday }`
					),
				},
			} );

			// Check.
			const formattedDate = dateNoI18n(
				formatString,
				'2019-06-18T11:00:00.000Z'
			);
			expect( formattedDate ).toBe( expected );

			// Restore default settings.
			setSettings( settings );
		}
	);

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const winterFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 06:00' );

		const summerFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check.
		const winterFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 07:00' );

		const summerFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		let formattedDate;
		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'+08:00'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			8
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			480
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings.
		setSettings( settings );
	} );
} );

describe( 'Function gmdate', () => {
	test.each( [
		[ 'j/n/y', '18/6/19' ],
		[ 'd/m/y', '18/06/19' ],
		[ 'D j M Y', 'Tue 18 Jun 2019' ],
		[ 'l jS F Y', 'Tuesday 18th June 2019' ],
		[ 'N w', '2 2' ],
		[ 'z', '168' ],
		[ 'W', '25' ],
		[ 't', '30' ],
		[ 'L', '0' ],
		[ 'o', '2019' ],
		[ 'g:i a', '11:00 am' ],
		[ 'h:i A', '11:00 AM' ],
		[ 'G:i:s', '11:00:00' ],
		[ 'H:i:s', '11:00:00' ],
		[ 'B', '499' ],
		[ 'u', '000000' ],
		[ 'v', '000' ],
		[ 'e I T', 'Coordinated Universal Time 0 UTC' ],
		[ 'O P Z', '+0000 +00:00 0' ],
		[ 'c', '2019-06-18T11:00:00+00:00' ],
		[ 'r', 'Tue, 18 Jun 2019 11:00:00 +0000' ],
		[ 'U', '1560855600' ],
	] )(
		'should format date as "%s", ignoring locale settings',
		( formatString, expected ) => {
			const settings = __experimentalGetSettings();

			// Simulate different locale.
			const l10n = settings.l10n;
			setSettings( {
				...settings,
				l10n: {
					...l10n,
					locale: 'es',
					months: l10n.months.map( ( month ) => `es_${ month }` ),
					monthsShort: l10n.monthsShort.map(
						( month ) => `es_${ month }`
					),
					weekdays: l10n.weekdays.map(
						( weekday ) => `es_${ weekday }`
					),
					weekdaysShort: l10n.weekdaysShort.map(
						( weekday ) => `es_${ weekday }`
					),
				},
			} );

			// Check.
			const formattedDate = gmdate(
				formatString,
				'2019-06-18T11:00:00.000Z'
			);
			expect( formattedDate ).toBe( expected );

			// Restore default settings.
			setSettings( settings );
		}
	);

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = gmdate( 'Y-m-d H:i', '2019-06-18T11:00:00.000Z' );
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings.
		setSettings( settings );
	} );
} );

describe( 'Function dateI18n', () => {
	test.each( [
		[ 'j/n/y', '18/6/19' ],
		[ 'd/m/y', '18/06/19' ],
		[ 'D j M Y', 'es_Tue 18 es_Jun 2019' ],
		[ 'l jS F Y', 'es_Tuesday 18th es_June 2019' ], // Day ordinal should be in English, matching wp_date().
		[ 'N w', '2 2' ],
		[ 'z', '168' ],
		[ 'W', '25' ],
		[ 't', '30' ],
		[ 'L', '0' ],
		[ 'o', '2019' ],
		[ 'g:i a', '11:00 am' ],
		[ 'h:i A', '11:00 AM' ],
		[ 'G:i:s', '11:00:00' ],
		[ 'H:i:s', '11:00:00' ],
		[ 'B', '499' ],
		[ 'u', '000000' ],
		[ 'v', '000' ],
		[ 'e I T', 'Coordinated Universal Time 0 UTC' ],
		[ 'O P Z', '+0000 +00:00 0' ],
		[ 'c', '2019-06-18T11:00:00+00:00' ],
		[ 'r', 'Tue, 18 Jun 2019 11:00:00 +0000' ], // Day and month should be in English, as per RFC 2822.
		[ 'U', '1560855600' ],
	] )(
		'should format date as "%s", using locale settings',
		( formatString, expected ) => {
			const settings = __experimentalGetSettings();

			// Simulate different locale.
			const l10n = settings.l10n;
			setSettings( {
				...settings,
				l10n: {
					...l10n,
					locale: 'es',
					months: l10n.months.map( ( month ) => `es_${ month }` ),
					monthsShort: l10n.monthsShort.map(
						( month ) => `es_${ month }`
					),
					weekdays: l10n.weekdays.map(
						( weekday ) => `es_${ weekday }`
					),
					weekdaysShort: l10n.weekdaysShort.map(
						( weekday ) => `es_${ weekday }`
					),
				},
			} );

			// Check.
			const formattedDate = dateI18n(
				formatString,
				'2019-06-18T11:00:00.000Z',
				true
			);
			expect( formattedDate ).toBe( expected );

			// Restore default settings.
			setSettings( settings );
		}
	);

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const winterFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 06:00' );

		const summerFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check.
		const winterFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 07:00' );

		const summerFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		let formattedDate;
		formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'+08:00'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateI18n( 'Y-m-d H:i', '2019-06-18T11:00:00.000Z', 8 );
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			480
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a UTC date if `gmt` is set to `true`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			true
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings.
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone if `gmt` is set to `false`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			false
		);
		expect( formattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings.
		setSettings( settings );
	} );
} );

describe( 'Function gmdateI18n', () => {
	test.each( [
		[ 'j/n/y', '18/6/19' ],
		[ 'd/m/y', '18/06/19' ],
		[ 'D j M Y', 'es_Tue 18 es_Jun 2019' ],
		[ 'l jS F Y', 'es_Tuesday 18th es_June 2019' ], // Day ordinal should be in English, matching wp_date().
		[ 'N w', '2 2' ],
		[ 'z', '168' ],
		[ 'W', '25' ],
		[ 't', '30' ],
		[ 'L', '0' ],
		[ 'o', '2019' ],
		[ 'g:i a', '11:00 am' ],
		[ 'h:i A', '11:00 AM' ],
		[ 'G:i:s', '11:00:00' ],
		[ 'H:i:s', '11:00:00' ],
		[ 'B', '499' ],
		[ 'u', '000000' ],
		[ 'v', '000' ],
		[ 'e I T', 'Coordinated Universal Time 0 UTC' ],
		[ 'O P Z', '+0000 +00:00 0' ],
		[ 'c', '2019-06-18T11:00:00+00:00' ],
		[ 'r', 'Tue, 18 Jun 2019 11:00:00 +0000' ], // Day and month should be in English, as per RFC 2822.
		[ 'U', '1560855600' ],
	] )(
		'should format date as "%s", using locale settings',
		( formatString, expected ) => {
			const settings = __experimentalGetSettings();

			// Simulate different locale.
			const l10n = settings.l10n;
			setSettings( {
				...settings,
				l10n: {
					...l10n,
					locale: 'es',
					months: l10n.months.map( ( month ) => `es_${ month }` ),
					monthsShort: l10n.monthsShort.map(
						( month ) => `es_${ month }`
					),
					weekdays: l10n.weekdays.map(
						( weekday ) => `es_${ weekday }`
					),
					weekdaysShort: l10n.weekdaysShort.map(
						( weekday ) => `es_${ weekday }`
					),
				},
			} );

			// Check.
			const formattedDate = gmdateI18n(
				formatString,
				'2019-06-18T11:00:00.000Z'
			);
			expect( formattedDate ).toBe( expected );

			// Restore default settings.
			setSettings( settings );
		}
	);

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone.
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check.
		const formattedDate = gmdateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings.
		setSettings( settings );
	} );
} );

describe( 'Function humanTimeDiff', () => {
	it( 'should show a human readable string showing the difference between two timestamps', () => {
		// Set a date one second in the past and check it works between then and now.
		expect(
			humanTimeDiff( new Date( Number( getDate() ) - 1000 ) )
		).toEqual( 'a few seconds' );

		// Set a date two seconds in the past and check it works between then and now.
		expect(
			humanTimeDiff( new Date( Number( getDate() ) - 1000 * 2 ) )
		).toEqual( 'a few seconds' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 2 ),
				new Date( Number( getDate() ) - 1000 * 3 )
			)
		).toEqual( 'a few seconds' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 2 ),
				new Date( Number( getDate() ) - 1000 * 61 )
			)
		).toEqual( 'a minute' );

		// Set a date one minute in the past and check it works between then and now.
		expect(
			humanTimeDiff( new Date( Number( getDate() ) - 1000 * 60 ) )
		).toEqual( 'a minute' );

		// Set a date two minutes in the past and check it works between then and now.
		expect(
			humanTimeDiff( new Date( Number( getDate() ) - 1000 * 120 ) )
		).toEqual( '2 minutes' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 ),
				new Date( Number( getDate() ) - 1000 * 120 )
			)
		).toEqual( 'a minute' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 44 )
			)
		).toEqual( '42 minutes' );

		// Set a date one hour in the past and check it works between then and now.
		expect(
			humanTimeDiff( new Date( Number( getDate() ) - 1000 * 60 * 60 ) )
		).toEqual( 'an hour' );

		// Set a date two hours in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 2 )
			)
		).toEqual( '2 hours' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 2 )
			)
		).toEqual( 'an hour' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 7 )
			)
		).toEqual( '5 hours' );

		// Set a date one day in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 )
			)
		).toEqual( 'a day' );

		// Set a date two hours in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 2 )
			)
		).toEqual( '2 days' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 3 )
			)
		).toEqual( 'a day' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 8 )
			)
		).toEqual( '6 days' );

		// Set a date one month in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 30 )
			)
		).toEqual( 'a month' );

		// Set a date two months in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 60 )
			)
		).toEqual( '2 months' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 60 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 90 )
			)
		).toEqual( 'a month' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 30 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 30 * 9 )
			)
		).toEqual( '7 months' );

		// Set a date one year in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 )
			)
		).toEqual( 'a year' );

		// Set a date one year in the future and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) + 1000 * 60 * 60 * 24 * 365 )
			)
		).toEqual( 'a year' );

		// Set a date two months in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 * 2 )
			)
		).toEqual( '2 years' );

		// Check it works when two timestamps are supplied.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 * 2 )
			)
		).toEqual( 'a year' );
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 ),
				new Date( Number( getDate() ) - 1000 * 60 * 60 * 24 * 365 * 12 )
			)
		).toEqual( '11 years' );
	} );

	it( 'should include the suffix if includeAffix is true', () => {
		// Set a date one second in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 ),
				new Date( Number( getDate() ) - 1000 ),
				true
			)
		).toEqual( 'a few seconds ago' );

		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 44 ),
				new Date( Number( getDate() ) - 1000 * 60 * 2 ),
				true
			)
		).toEqual( '42 minutes ago' );

		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 * 60 * 2 ),
				new Date( Number( getDate() ) - 1000 * 60 * 44 ),
				true
			)
		).toEqual( 'in 42 minutes' );
	} );
	it( 'should ignore the timezone if both dates are in the same timezone', () => {
		const settings = __experimentalGetSettings();

		// Set a timezone in the past.
		setSettings( {
			...settings,
			timezone: { offset: '-4', string: 'America/New_York' },
		} );
		// Set a date one second in the past and check it works between then and now.
		expect(
			humanTimeDiff(
				new Date( Number( getDate() ) - 1000 ),
				new Date( Number( getDate() ) - 2000 )
			)
		).toEqual( 'a few seconds' );
	} );

	it( 'should compare across two different timezones', () => {
		// Set a date in UTC and another in America/New_York (4 hours in the past) and check it works between the different timestamps.
		expect(
			humanTimeDiff(
				momentLib.tz( '2022-06-07T22:31:18', 'America/New_York' ),
				momentLib.tz( '2022-06-07T22:31:18', 'Etc/UTC' )
			)
		).toEqual( '4 hours' );
	} );
} );

describe( 'Moment.js Localization', () => {
	it( 'should change the relative time strings', () => {
		const settings = __experimentalGetSettings();

		// Change the locale strings for tests.
		setSettings( {
			...settings,
			l10n: {
				...settings.l10n,
				relative: {
					...settings.l10n.relative,
					mm: '%d localized minutes',
					hh: '%d localized hours',
				},
			},
		} );

		// Get the freshly changed setings.
		const newSettings = __experimentalGetSettings();

		// Test the unchanged values.
		expect( newSettings.l10n.locale ).toBe( settings.l10n.locale );

		// Test the changed values.
		expect( newSettings.l10n.relative.mm ).toBe( '%d localized minutes' );
		expect( newSettings.l10n.relative.hh ).toBe( '%d localized hours' );

		// Restore default settings.
		setSettings( settings );
	} );
} );
