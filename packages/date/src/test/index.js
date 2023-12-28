/**
 * Internal dependencies
 */
import {
	getSettings,
	date as dateNoI18n,
	dateI18n,
	getDate,
	gmdate,
	gmdateI18n,
	isInTheFuture,
	setSettings,
	humanTimeDiff,
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
		const settings = getSettings();

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
			const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
			const settings = getSettings();

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
		const settings = getSettings();

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
			const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
		const settings = getSettings();

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
			const settings = getSettings();

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
		const settings = getSettings();

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

describe( 'Moment.js Localization', () => {
	it( 'should change the relative time strings', () => {
		const settings = getSettings();

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
		const newSettings = getSettings();

		// Test the unchanged values.
		expect( newSettings.l10n.locale ).toBe( settings.l10n.locale );

		// Test the changed values.
		expect( newSettings.l10n.relative.mm ).toBe( '%d localized minutes' );
		expect( newSettings.l10n.relative.hh ).toBe( '%d localized hours' );

		// Restore default settings.
		setSettings( settings );
	} );

	describe( 'humanTimeDiff', () => {
		it( 'should return human readable time differences in the past', () => {
			expect(
				humanTimeDiff(
					'2023-04-28T11:00:00.000Z',
					'2023-04-28T12:00:00.000Z'
				)
			).toBe( 'an hour ago' );
			expect(
				humanTimeDiff(
					'2023-04-28T11:00:00.000Z',
					'2023-04-28T13:00:00.000Z'
				)
			).toBe( '2 hours ago' );
			expect(
				humanTimeDiff(
					'2023-04-28T11:00:00.000Z',
					'2023-04-30T13:00:00.000Z'
				)
			).toBe( '2 days ago' );
		} );

		it( 'should return human readable time differences in the future', () => {
			// Future.
			const now = new Date();
			const twoHoursLater = new Date(
				now.getTime() + 2 * 60 * 60 * 1000
			);
			expect( humanTimeDiff( twoHoursLater ) ).toBe( 'in 2 hours' );

			const twoDaysLater = new Date(
				now.getTime() + 2 * 24 * 60 * 60 * 1000
			); // Adding 2 days in milliseconds

			expect( humanTimeDiff( twoDaysLater ) ).toBe( 'in 2 days' );
		} );
	} );
} );
