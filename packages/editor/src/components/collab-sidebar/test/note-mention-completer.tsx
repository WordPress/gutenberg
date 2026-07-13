/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import type { ReactElement } from 'react';

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

const mockedUseSelect = jest.mocked( useSelect );

describe( 'noteMentionCompleter', () => {
	it( 'is an `@`-triggered completer', () => {
		expect( noteMentionCompleter.triggerPrefix ).toBe( '@' );
	} );

	describe( 'getOptionCompletion', () => {
		it( 'inserts a non-link mention span carrying the user id', () => {
			const completion = noteMentionCompleter.getOptionCompletion( {
				id: 5,
				name: 'Jane Doe',
			} );

			expect( completion.action ).toBe( 'insert-at-caret' );

			const mention = completion.value as ReactElement;
			// A mention marks a person; it must not be a navigation link.
			expect( mention.type ).toBe( 'span' );
			expect( mention.props.className ).toBe( 'wp-note-mention' );
			expect( mention.props[ 'data-user-id' ] ).toBe( 5 );
			/*
			 * `mention` is the React element returned by the completer, not a
			 * rendered DOM node, so inspecting its `children` prop is the
			 * intended assertion rather than DOM traversal.
			 */
			// eslint-disable-next-line testing-library/no-node-access
			expect( mention.props.children ).toBe( '@Jane Doe' );
		} );
	} );

	describe( 'useItems', () => {
		let getUsers: jest.Mock;
		let getCurrentUser: jest.Mock;

		beforeEach( () => {
			getUsers = jest.fn( () => [] );
			getCurrentUser = jest.fn( () => ( { id: 99 } ) );
			mockedUseSelect.mockImplementation( ( mapSelect: any ) =>
				mapSelect( () => ( { getUsers, getCurrentUser } ) )
			);
		} );

		afterEach( () => {
			mockedUseSelect.mockReset();
		} );

		it( 'queries site users, leaving out the current user', () => {
			renderHook( () => noteMentionCompleter.useItems( 'jane' ) );

			expect( getUsers ).toHaveBeenCalledWith( {
				context: 'view',
				search: 'jane',
				per_page: 10,
				exclude: [ 99 ],
			} );
		} );

		it( 'omits the exclusion while the current user is unknown', () => {
			getCurrentUser.mockReturnValue( undefined );

			renderHook( () => noteMentionCompleter.useItems( 'jane' ) );

			expect( getUsers ).toHaveBeenCalledWith( {
				context: 'view',
				search: 'jane',
				per_page: 10,
			} );
		} );

		it( 'lets integrators change the query via the filter', () => {
			addFilter(
				'editor.notes.mentionUserQuery',
				'test/narrow',
				( query: Record< string, unknown > ) => ( {
					...query,
					who: 'authors',
				} )
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
