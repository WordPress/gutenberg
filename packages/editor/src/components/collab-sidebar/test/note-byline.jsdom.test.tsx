import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { getSettings, setSettings } from '@wordpress/date';
import { Tooltip } from '@wordpress/ui';
import { NoteByline } from '../note-byline';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), { spy: true } );

const mockedUseSelect = vi.mocked( useSelect );

describe( 'NoteByline', () => {
	let dateSettings: ReturnType< typeof getSettings >;

	beforeEach( () => {
		mockedUseSelect.mockReturnValue( { dateFormat: 'F j, Y' } );

		dateSettings = getSettings();
		// The REST API gives note dates as site-local time without an
		// offset. Use a site timezone that differs from the test runner's
		// (UTC) to tell site time from browser time.
		setSettings( {
			...dateSettings,
			timezone: {
				...dateSettings.timezone,
				offset: 9,
				string: 'Asia/Tokyo',
				abbr: 'JST',
			},
		} );
	} );

	afterEach( () => {
		setSettings( dateSettings );
		mockedUseSelect.mockReset();
	} );

	it( 'shows the full note date in the site timezone in the tooltip', async () => {
		const user = userEvent.setup();
		render(
			<Tooltip.Provider delay={ 0 } closeDelay={ 0 }>
				<NoteByline
					avatar="https://example.com/avatar.png"
					name="Jane Doe"
					date="2026-07-14T12:00:00"
					userId={ 1 }
				/>
			</Tooltip.Provider>
		);

		const time = screen.getByText( 'July 14, 2026' );
		expect( time ).toHaveAttribute(
			'dateTime',
			'2026-07-14T12:00:00+09:00'
		);

		await user.hover( time );
		// The non-breaking space of the format collapses to a plain space in
		// the text matcher.
		expect(
			await screen.findByText( 'July 14, 2026 12:00 pm' )
		).toBeVisible();
	} );
} );
