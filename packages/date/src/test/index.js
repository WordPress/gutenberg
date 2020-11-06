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

		// Set a timezone in the future
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

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function date', () => {
	it( 'should format date in English, ignoring locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
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
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = dateNoI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( 'June Jun Tuesday Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );
} );

// Custom formatting  token functions, in order to support PHP formatting tokens
describe( 'PHP Format Tokens', () => {
	it( 'should support "S" to obtain ordinal suffix of day of the month', () => {
		const formattedDate = dateNoI18n( 'S', '2019-06-18T11:00:00.000Z' );

		// th for 18th
		expect( formattedDate ).toBe( 'th' );
	} );

	it( 'should support "z" to obtain zero-indexed day of the year', () => {
		const formattedDate = dateNoI18n( 'z', '2019-01-01' );

		expect( formattedDate ).toBe( '0' );
	} );

	it( 'should support "t" to obtain the days in a given month', () => {
		const formattedDate = dateNoI18n( 't', '2019-02' );

		expect( formattedDate ).toBe( '28' );
	} );

	it( 'should support "L" to obtain whether or not the year is a leap year', () => {
		const formattedDate = dateNoI18n( 'L', '2020' );

		expect( formattedDate ).toBe( '1' );
	} );

	it( 'should support "B" to obtain the time in Swatch Internet Time (.beats)', () => {
		const formattedDate = dateNoI18n( 'B', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( '500' );
	} );

	it.skip( 'should support "I" to obtain whether or not the timezone is observing DST', () => {
		const formattedFall = dateNoI18n( 'I', '2020-10-09T11:00:00.000Z' );

		expect( formattedFall ).toBe( '1' );

		const formattedWinter = dateNoI18n( 'I', '2020-01-09T11:00:00.000Z' );

		expect( formattedWinter ).toBe( '0' );
	} );
	it.skip( 'should support "Z" to obtain timezone offset in seconds', () => {
		const formattedDate = dateNoI18n( 'Z', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( '0' );
	} );
} );

describe( 'Function gmdate', () => {
	it( 'should format date in English, ignoring locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
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
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = gmdate( 'F M l D', '2019-06-18T11:00:00.000Z' );
		expect( formattedDate ).toBe( 'June Jun Tuesday Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = gmdate( 'Y-m-d H:i', '2019-06-18T11:00:00.000Z' );
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function dateI18n', () => {
	it( 'should format date using locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
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
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = dateI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z',
			true
		);
		expect( formattedDate ).toBe( 'es_June es_Jun es_Tuesday es_Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
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

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date if `gmt` is set to `true`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			true
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone if `gmt` is set to `false`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			false
		);
		expect( formattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function gmdateI18n', () => {
	it( 'should format date using locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
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
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = gmdateI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( 'es_June es_Jun es_Tuesday es_Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = gmdateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
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

		// Restore default settings
		setSettings( settings );
	} );
} );
