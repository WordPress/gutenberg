/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import noteMentionCompleter from '../note-mention-completer';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

// The completer only uses the core-data store as an opaque selector token, so
// stub it to avoid pulling the full `@wordpress/core-data` module graph.
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

describe( 'noteMentionCompleter', () => {
	it( 'is an `@`-triggered completer', () => {
		expect( noteMentionCompleter.triggerPrefix ).toBe( '@' );
	} );

	describe( 'getOptionCompletion', () => {
		it( 'inserts a mention link carrying the user id', () => {
			const completion = noteMentionCompleter.getOptionCompletion( {
				id: 5,
				name: 'Jane Doe',
				slug: 'jane',
				link: 'https://example.com/author/jane',
			} );

			expect( completion.action ).toBe( 'insert-at-caret' );

			const anchor = completion.value;
			expect( anchor.type ).toBe( 'a' );
			expect( anchor.props.className ).toBe( 'wp-note-mention' );
			expect( anchor.props[ 'data-user-id' ] ).toBe( 5 );
			expect( anchor.props.href ).toBe(
				'https://example.com/author/jane'
			);
			/*
			 * `anchor` is the React element returned by the completer, not a
			 * rendered DOM node, so inspecting its `children` prop is the
			 * intended assertion rather than DOM traversal.
			 */
			// eslint-disable-next-line testing-library/no-node-access
			expect( anchor.props.children ).toBe( '@Jane Doe' );
		} );
	} );

	describe( 'useItems', () => {
		let getUsers;

		beforeEach( () => {
			getUsers = jest.fn( () => [] );
			useSelect.mockImplementation( ( mapSelect ) =>
				mapSelect( () => ( { getUsers } ) )
			);
		} );

		afterEach( () => {
			useSelect.mockReset();
		} );

		it( 'queries all site users by default', () => {
			renderHook( () => noteMentionCompleter.useItems( 'jane' ) );

			expect( getUsers ).toHaveBeenCalledWith( {
				context: 'view',
				search: 'jane',
				per_page: 10,
			} );
		} );

		it( 'lets integrators narrow the query via the filter', () => {
			addFilter(
				'editor.notes.mentionUserQuery',
				'test/narrow',
				( query ) => ( { ...query, who: 'authors' } )
			);

			renderHook( () => noteMentionCompleter.useItems( 'jane' ) );

			expect( getUsers ).toHaveBeenCalledWith(
				expect.objectContaining( { who: 'authors' } )
			);

			removeFilter( 'editor.notes.mentionUserQuery', 'test/narrow' );
		} );

		it( 'maps users to keyed options', () => {
			getUsers.mockReturnValue( [
				{ id: 5, name: 'Jane Doe', slug: 'jane' },
			] );

			const { result } = renderHook( () =>
				noteMentionCompleter.useItems( 'jane' )
			);

			const [ options ] = result.current;
			expect( options ).toHaveLength( 1 );
			expect( options[ 0 ].key ).toBe( 'note-mention-jane' );
			expect( options[ 0 ].value ).toEqual( {
				id: 5,
				name: 'Jane Doe',
				slug: 'jane',
			} );
		} );
	} );
} );
