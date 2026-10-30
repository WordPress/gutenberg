import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DateView from '../post_type_supports/date/view';

describe( 'DateView', () => {
	it.each( [
		[ 'reset', null ],
		[ 'following its modified date', '2026-10-20T10:00:00' ],
	] )( 'shows a draft whose date is %s as immediate', ( _, date ) => {
		render(
			<DateView
				item={ {
					status: 'draft',
					date,
					modified: '2026-10-20T10:00:00',
				} }
			/>
		);
		expect( screen.getByText( 'Immediately' ) ).toBeInTheDocument();
	} );

	it( 'shows the date a draft is set to', () => {
		render(
			<DateView
				item={ {
					status: 'draft',
					date: '2026-10-13T21:45:00',
					modified: '2026-10-20T10:00:00',
				} }
			/>
		);
		expect( screen.queryByText( 'Immediately' ) ).not.toBeInTheDocument();
	} );
} );
