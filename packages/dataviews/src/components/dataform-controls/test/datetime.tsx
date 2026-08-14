import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dateI18n, getDate, getSettings, setSettings } from '@wordpress/date';
import normalizeFields from '../../../field-types';
import DateTime from '../datetime';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

type TestItem = {
	published?: string;
};

const field = normalizeFields< TestItem >( [
	{
		id: 'published',
		label: 'Published',
		type: 'datetime',
	},
] )[ 0 ];

const fullDateFormatter = new Intl.DateTimeFormat( 'en-US', {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
} );

const getDayButton = ( date: Date ) =>
	screen.getByRole( 'button', {
		name: new RegExp( fullDateFormatter.format( date ) ),
	} );

describe( 'DateTime control', () => {
	describe( 'with a site timezone different from the local timezone', () => {
		const originalSettings = getSettings();

		beforeAll( () => {
			// An offset this far behind guarantees the site's calendar day
			// differs from the local one at local midnight, wherever the
			// test runs.
			setSettings( {
				...originalSettings,
				timezone: {
					...originalSettings.timezone,
					offset: -12,
					string: '',
				},
			} );
		} );

		afterAll( () => {
			setSettings( originalSettings );
		} );

		it( 'should store the day that was clicked in the calendar', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();
			render(
				<DateTime
					data={ { published: '2024-03-15T10:30:00.000Z' } }
					field={ field }
					onChange={ onChange }
				/>
			);

			await user.click( getDayButton( new Date( 2024, 2, 20 ) ) );

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			const edits = onChange.mock.calls[ 0 ][ 0 ];
			// The stored value keeps the clicked calendar day and the time of
			// the previous value, both in the site timezone.
			expect( dateI18n( 'Y-m-d H:i', getDate( edits.published ) ) ).toBe(
				'2024-03-20 22:30'
			);
		} );
	} );
} );
