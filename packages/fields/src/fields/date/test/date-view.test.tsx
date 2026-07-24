/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import DateView from '../date-view';
import type { BasePost } from '../../../types';

describe( 'DateView', () => {
	it( 'renders nothing when the post has no date', () => {
		// `getDate( null )` falls back to the current time, so a missing date
		// used to render "now" — a value the post has no relation to. This is
		// what bulk Quick Edit hits, where the form starts from an empty record.
		const { container } = render(
			<DateView item={ {} as BasePost } field={ {} as never } />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing when the post has no date but a status', () => {
		const { container } = render(
			<DateView
				item={ { status: 'draft' } as BasePost }
				field={ {} as never }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'labels a published post with its publish date', () => {
		render(
			<DateView
				item={
					{
						status: 'publish',
						date: '2026-01-05T10:30:00',
					} as BasePost
				}
				field={ {} as never }
			/>
		);

		expect( screen.getByText( /^Published:/ ) ).toBeVisible();
		expect( screen.getByText( /Jan 5, 2026/ ) ).toBeVisible();
	} );

	it( 'labels a scheduled post with its scheduled date', () => {
		render(
			<DateView
				item={
					{
						status: 'future',
						date: '2026-01-05T10:30:00',
					} as BasePost
				}
				field={ {} as never }
			/>
		);

		expect( screen.getByText( /^Scheduled:/ ) ).toBeVisible();
	} );

	it( 'labels a draft with its modified date', () => {
		render(
			<DateView
				item={
					{
						status: 'draft',
						date: '2026-01-05T10:30:00',
					} as BasePost
				}
				field={ {} as never }
			/>
		);

		expect( screen.getByText( /^Modified:/ ) ).toBeVisible();
	} );

	it( 'renders a bare date for an unrecognized status', () => {
		render(
			<DateView
				item={
					{
						status: 'some-custom-status',
						date: '2026-01-05T10:30:00',
					} as BasePost
				}
				field={ {} as never }
			/>
		);

		expect( screen.getByText( /Jan 5, 2026/ ) ).toBeVisible();
	} );
} );
