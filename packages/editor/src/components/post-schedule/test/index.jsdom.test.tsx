import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import PostSchedule from '../index';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

// The date picker measures its layout.
globalThis.wpVitest.mockResizeObserver();

type MonthBounds = { after: string; before: string };

type Post = {
	date: string | null;
	modified: string;
	status: string;
};

// Stands in for the editor and core stores, and records the queries the
// calendar makes for the posts it marks.
function createTestRegistry( post: Post, queriedMonths: MonthBounds[] = [] ) {
	const editor = createReduxStore( 'core/editor', {
		reducer: ( state = {} ) => state,
		actions: { editPost: () => ( { type: 'EDIT_POST' } ) },
		selectors: {
			getEditedPostAttribute: ( state: unknown, attribute: string ) =>
				( post as Record< string, unknown > )[ attribute ],
			getCurrentPostType: () => 'post',
			getCurrentPostId: () => 1,
			// As `isEditedPostDateFloating()` has it.
			isEditedPostDateFloating: () =>
				[ 'draft', 'auto-draft', 'pending' ].includes( post.status ) &&
				( post.date === null || post.date === post.modified ),
		},
	} );
	const core = createReduxStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
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
	registry.register( editor );
	registry.register( core );
	return registry;
}

describe( 'PostSchedule', () => {
	afterEach( () => {
		vi.useRealTimers();
	} );

	function atNovember() {
		vi.useFakeTimers( { toFake: [ 'Date' ] } );
		vi.setSystemTime( new Date( '2026-11-23T10:00:00Z' ) );
	}

	const floatingDraft = {
		date: '2022-04-28T15:30:00',
		modified: '2022-04-28T15:30:00',
		status: 'draft',
	};

	it( 'shows the date of a post that has one', async () => {
		const registry = createTestRegistry( {
			...floatingDraft,
			modified: '2022-05-02T10:00:00',
		} );
		render(
			<RegistryProvider value={ registry }>
				<PostSchedule onClose={ () => {} } />
			</RegistryProvider>
		);
		expect(
			await screen.findByRole( 'button', {
				name: /April 28, 2022\. Selected/,
			} )
		).toBeInTheDocument();
	} );

	describe( 'with a floating date', () => {
		it( 'shows now, not the date the draft was last saved', async () => {
			atNovember();
			render(
				<RegistryProvider value={ createTestRegistry( floatingDraft ) }>
					<PostSchedule onClose={ () => {} } />
				</RegistryProvider>
			);
			expect(
				await screen.findByRole( 'button', {
					name: /November 23, 2026\. Selected/,
				} )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /April 28, 2022/ } )
			).not.toBeInTheDocument();
		} );

		it( "marks the posts of today's month", async () => {
			atNovember();
			const queriedMonths: MonthBounds[] = [];
			render(
				<RegistryProvider
					value={ createTestRegistry( floatingDraft, queriedMonths ) }
				>
					<PostSchedule onClose={ () => {} } />
				</RegistryProvider>
			);
			await screen.findByRole( 'application', { name: 'Calendar' } );
			expect( queriedMonths.at( -1 ) ).toEqual( {
				after: '2026-10-31T23:59:59',
				before: '2026-12-01T00:00:00',
			} );
		} );
	} );
} );
