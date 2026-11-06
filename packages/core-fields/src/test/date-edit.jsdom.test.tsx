import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import DateEdit from '../post_type_supports/date/edit';

vi.mock( import( '@wordpress/a11y' ), () => ( { speak: vi.fn() } ) );

// The date picker measures its layout.
globalThis.wpVitest.mockResizeObserver();

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
} );
