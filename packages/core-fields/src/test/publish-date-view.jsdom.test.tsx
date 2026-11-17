import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import PublishDateView from '../post_type_supports/publish_date/view';

// The view reads the saved post from the `core` store; a stand-in avoids the
// resolvers' requests.
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

function mountView(
	item: Record< string, unknown >,
	savedStatus = item.status as string
) {
	const { container } = render(
		<RegistryProvider value={ createTestRegistry( savedStatus ) }>
			<PublishDateView item={ { id: 1, type: 'post', ...item } } />
		</RegistryProvider>
	);
	return container;
}

describe( 'PublishDateView', () => {
	it( 'says a post whose date was reset publishes immediately', () => {
		mountView( { status: 'publish', date: null } );
		expect( screen.getByText( 'Immediately' ) ).toBeInTheDocument();
	} );

	it( 'shows nothing for a bulk edit that left the date untouched', () => {
		const container = mountView( {} );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'says a bulk edit that reset the date publishes immediately', () => {
		mountView( { date: null } );
		expect( screen.getByText( 'Immediately' ) ).toBeInTheDocument();
	} );

	it( 'says a draft whose date follows its modified date publishes immediately', () => {
		mountView( {
			status: 'draft',
			date: '2026-09-30T12:00:00',
			modified: '2026-09-30T12:00:00',
		} );
		expect( screen.getByText( 'Immediately' ) ).toBeInTheDocument();
	} );

	it( 'reads the saved status, not the edited one', () => {
		// A published post switched to draft in the form still has its date.
		mountView(
			{
				status: 'draft',
				date: '2026-09-30T12:00:00',
				modified: '2026-09-30T12:00:00',
			},
			'publish'
		);
		expect( screen.queryByText( 'Immediately' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the date of a post that has one, whatever its status', () => {
		const container = mountView( {
			status: 'publish',
			date: '2020-09-30T12:00:00',
			modified: '2020-10-01T12:00:00',
		} );
		expect( container ).toHaveTextContent(
			/^September 30, 2020 12:00\spm$/
		);
	} );
} );
