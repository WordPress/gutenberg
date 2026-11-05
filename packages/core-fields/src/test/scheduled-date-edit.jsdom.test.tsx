import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import ScheduledDateEdit from '../post_type_supports/scheduled_date/edit';

// The date inputs measure their layout.
globalThis.wpVitest.mockResizeObserver();

const field = {
	id: 'scheduled_date',
	label: 'Scheduled Date',
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
		},
	} );
	const registry = createRegistry();
	registry.register( store );
	return registry;
}

async function mountEdit(
	data: Record< string, unknown >,
	onChange = vi.fn()
) {
	render(
		<RegistryProvider value={ createTestRegistry( 'future' ) }>
			<ScheduledDateEdit
				data={ { id: 1, type: 'post', status: 'future', ...data } }
				field={ field }
				onChange={ onChange }
			/>
		</RegistryProvider>
	);
	// Wait for the time inputs to settle.
	await screen.findByRole( 'spinbutton', { name: 'Day' } );
	return onChange;
}

describe( 'ScheduledDateEdit', () => {
	it( 'has date and time inputs, but no calendar', async () => {
		await mountEdit( { date: '2099-10-13T21:45:00' } );
		expect(
			screen.getByRole( 'spinbutton', { name: 'Day' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'spinbutton', { name: 'Hours' } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'grid' ) ).not.toBeInTheDocument();
	} );

	it( 'edits the date of the post', async () => {
		const onChange = await mountEdit( { date: '2099-10-13T21:45:00' } );
		const year = screen.getByRole( 'spinbutton', { name: 'Year' } );
		fireEvent.change( year, { target: { value: '2098' } } );
		fireEvent.blur( year );
		expect( onChange ).toHaveBeenCalledWith( {
			date: '2098-10-13T21:45:00',
		} );
	} );

	it( 'says a scheduled post whose date was reset publishes immediately', async () => {
		await mountEdit( { date: null } );
		expect( screen.getByText( 'Publishes immediately.' ) ).toBeVisible();
	} );

	it( 'says a scheduled post whose date is in the past publishes immediately', async () => {
		await mountEdit( { date: '2000-01-01T00:00:00' } );
		expect( screen.getByText( 'Publishes immediately.' ) ).toBeVisible();
	} );

	it( "doesn't say a scheduled post whose date is in the future publishes immediately", async () => {
		await mountEdit( { date: '2099-10-13T21:45:00' } );
		expect(
			screen.queryByText( 'Publishes immediately.' )
		).not.toBeInTheDocument();
	} );
} );
