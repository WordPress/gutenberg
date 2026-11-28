import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { getSettings, setSettings } from '@wordpress/date';
import DateEdit from '../post_type_supports/date/edit';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

// The date picker measures its layout.
globalThis.wpVitest.mockResizeObserver();

type MonthBounds = { after: string; before: string };

const field = {
	id: 'date',
	label: 'Date',
	type: 'datetime',
	getValue: ( { item }: { item: { date?: string | null } } ) => item.date,
	setValue: ( { value }: { value?: string } ) => ( { date: value ?? null } ),
	isDisabled: () => false,
} as any;

// The control reads the saved post from the `core` store; a stand-in avoids
// the resolvers' requests.
function createTestRegistry( savedStatus: string ) {
	const store = createReduxStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getEntityRecord: () => ( { status: savedStatus } ),
			getEntityRecords: () => [],
		},
	} );
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

describe( 'DateEdit', () => {
	it( 'resets the date of a post to `null`', async () => {
		const onChange = vi.fn();
		render(
			<DateEdit
				data={ {
					status: 'publish',
					date: '2026-10-13T21:45:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ onChange }
			/>
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: 'Reset' } )
		);
		expect( onChange ).toHaveBeenCalledWith( { date: null } );
	} );

	it( 'lets a draft reset its date, without a note', async () => {
		render(
			<DateEdit
				data={ {
					status: 'draft',
					date: '2026-10-20T10:00:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		const reset = await screen.findByRole( 'button', { name: 'Reset' } );
		expect( reset ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( reset ).not.toHaveAccessibleDescription();
	} );

	it( 'says a floating draft publishes immediately when it is scheduled but not saved', async () => {
		render(
			<RegistryProvider value={ createTestRegistry( 'draft' ) }>
				<DateEdit
					data={ {
						id: 1,
						type: 'post',
						status: 'future',
						date: '2026-10-20T10:00:00',
						modified: '2026-10-20T10:00:00',
					} }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).toHaveAccessibleDescription( 'Publishes immediately.' );
	} );

	it( 'says a draft with a past date publishes immediately when it is scheduled but not saved', async () => {
		render(
			<RegistryProvider value={ createTestRegistry( 'draft' ) }>
				<DateEdit
					data={ {
						id: 1,
						type: 'post',
						status: 'future',
						date: '2020-01-01T10:00:00',
						modified: '2026-10-20T10:00:00',
					} }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).toHaveAccessibleDescription( 'Publishes immediately.' );
	} );

	it( "doesn't say a published post publishes immediately when it is made a draft but not saved", async () => {
		render(
			<RegistryProvider value={ createTestRegistry( 'publish' ) }>
				<DateEdit
					data={ {
						id: 1,
						type: 'post',
						status: 'draft',
						date: '2026-10-20T10:00:00',
						modified: '2026-10-20T10:00:00',
					} }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).not.toHaveAccessibleDescription();
	} );

	it( 'disables the reset of a published post whose date was reset', async () => {
		render(
			<DateEdit
				data={ {
					status: 'publish',
					date: null,
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		const reset = await screen.findByRole( 'button', { name: 'Reset' } );
		expect( reset ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( reset ).not.toHaveAccessibleDescription();
	} );

	it( 'says a scheduled post whose date was reset publishes immediately', async () => {
		render(
			<DateEdit
				data={ {
					status: 'future',
					date: null,
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).toHaveAccessibleDescription( 'Publishes immediately.' );
	} );

	it( 'says a scheduled post whose date is in the past publishes immediately', async () => {
		render(
			<DateEdit
				data={ {
					status: 'future',
					date: '2020-01-01T10:00:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).toHaveAccessibleDescription( 'Publishes immediately.' );
	} );

	it( "doesn't say a scheduled post whose date is in the future publishes immediately", async () => {
		render(
			<DateEdit
				data={ {
					status: 'future',
					date: '2999-01-01T10:00:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		expect(
			await screen.findByRole( 'button', { name: 'Reset' } )
		).not.toHaveAccessibleDescription();
	} );

	it( 'announces the date picked for a post', async () => {
		render(
			<DateEdit
				data={ {
					status: 'publish',
					date: '2026-10-13T21:45:00',
					modified: '2026-10-20T10:00:00',
				} }
				field={ field }
				onChange={ () => {} }
			/>
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: /October 15, 2026/ } )
		);
		expect( speak ).toHaveBeenCalledWith(
			expect.stringMatching( /^Publish date set to .*2026.*\.$/ ),
			'assertive'
		);
	} );

	it( "doesn't announce the date picked in a filter", async () => {
		vi.mocked( speak ).mockClear();
		render(
			<DateEdit
				data={ { date: '2026-10-13T21:45:00' } }
				field={ field }
				onChange={ () => {} }
				operator="is"
			/>
		);
		fireEvent.click(
			await screen.findByRole( 'button', { name: /October 15, 2026/ } )
		);
		expect( speak ).not.toHaveBeenCalled();
	} );
	it( 'marks the posts of the month the date moves to', async () => {
		const queriedMonths: MonthBounds[] = [];
		const store = createReduxStore( 'core', {
			reducer: ( state = {} ) => state,
			selectors: {
				getEntityRecord: () => ( { status: 'draft' } ),
				getEntityRecords: (
					state: unknown,
					kind: string,
					name: string,
					query: MonthBounds
				) => {
					queriedMonths.push( {
						after: query.after,
						before: query.before,
					} );
					return [];
				},
			},
		} );
		const registry = createRegistry();
		registry.register( store );
		const data = {
			id: 1,
			type: 'post',
			status: 'draft',
			modified: '2026-10-20T10:00:00',
		};
		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<DateEdit
					data={ { ...data, date: '2026-11-04T10:00:00' } }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect( queriedMonths.at( -1 ) ).toEqual( {
			after: '2026-10-31T23:59:59',
			before: '2026-12-01T00:00:00',
		} );

		// A date from outside the calendar, like the Month input.
		rerender(
			<RegistryProvider value={ registry }>
				<DateEdit
					data={ { ...data, date: '2026-08-04T10:00:00' } }
					field={ field }
					onChange={ () => {} }
				/>
			</RegistryProvider>
		);
		expect(
			await screen.findByRole( 'button', { name: /August 4, 2026/ } )
		).toBeInTheDocument();
		expect( queriedMonths.at( -1 ) ).toEqual( {
			after: '2026-07-31T23:59:59',
			before: '2026-09-01T00:00:00',
		} );
	} );
	describe( 'without a date', () => {
		const originalSettings = getSettings();

		afterEach( () => {
			vi.useRealTimers();
			setSettings( originalSettings );
		} );

		// Just after midnight UTC on November 1, it is still October 31 on a
		// site in New York, so the calendar shows October.
		function atMonthBoundary() {
			vi.useFakeTimers( { toFake: [ 'Date' ] } );
			vi.setSystemTime( new Date( '2026-11-01T00:30:00Z' ) );
			setSettings( {
				...originalSettings,
				timezone: {
					offset: -4,
					offsetFormatted: '-4',
					string: 'America/New_York',
					abbr: 'EDT',
				},
			} );
		}

		function createRecordingRegistry( queriedMonths: MonthBounds[] ) {
			const store = createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				selectors: {
					getEntityRecord: () => ( { status: 'draft' } ),
					getEntityRecords: (
						state: unknown,
						kind: string,
						name: string,
						query: MonthBounds
					) => {
						queriedMonths.push( {
							after: query.after,
							before: query.before,
						} );
						return [];
					},
				},
			} );
			const registry = createRegistry();
			registry.register( store );
			return registry;
		}

		const data = {
			id: 1,
			type: 'post',
			status: 'draft',
			modified: '2026-10-20T10:00:00',
		};

		it( "marks the posts of today's month in the site's timezone", async () => {
			atMonthBoundary();
			const queriedMonths: MonthBounds[] = [];
			render(
				<RegistryProvider
					value={ createRecordingRegistry( queriedMonths ) }
				>
					<DateEdit
						data={ { ...data, date: null } }
						field={ field }
						onChange={ () => {} }
					/>
				</RegistryProvider>
			);
			await screen.findByRole( 'button', { name: 'Reset' } );
			expect( queriedMonths.at( -1 ) ).toEqual( {
				after: '2026-09-30T23:59:59',
				before: '2026-11-01T00:00:00',
			} );
		} );

		it( "marks the posts of today's month in the site's timezone after a reset", async () => {
			atMonthBoundary();
			const queriedMonths: MonthBounds[] = [];
			const registry = createRecordingRegistry( queriedMonths );
			const { rerender } = render(
				<RegistryProvider value={ registry }>
					<DateEdit
						data={ { ...data, date: '2026-08-04T10:00:00' } }
						field={ field }
						onChange={ () => {} }
					/>
				</RegistryProvider>
			);
			await screen.findByRole( 'button', { name: 'Reset' } );
			expect( queriedMonths.at( -1 ) ).toEqual( {
				after: '2026-07-31T23:59:59',
				before: '2026-09-01T00:00:00',
			} );
			rerender(
				<RegistryProvider value={ registry }>
					<DateEdit
						data={ { ...data, date: null } }
						field={ field }
						onChange={ () => {} }
					/>
				</RegistryProvider>
			);
			await screen.findByRole( 'button', { name: 'Reset' } );
			expect( queriedMonths.at( -1 ) ).toEqual( {
				after: '2026-09-30T23:59:59',
				before: '2026-11-01T00:00:00',
			} );
		} );
	} );
} );
