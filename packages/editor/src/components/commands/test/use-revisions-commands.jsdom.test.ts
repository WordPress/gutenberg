import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRevisionsCommands } from '..';

// Modules imported by the hook read `matchMedia` as they load.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
	useDispatch: vi.fn(),
} ) );

vi.mock( import( '../../../lock-unlock' ), async ( importOriginal ) => {
	const original = await importOriginal();
	const { unlock } = original;
	return {
		...original,
		// The mocked `useDispatch` result isn't a locked object.
		unlock: < T >( object: unknown ): T => {
			try {
				return unlock< T >( object );
			} catch {
				return object as T;
			}
		},
	};
} );

const setCurrentRevisionId = vi.fn();

type State = {
	lastRevisionId?: number | null;
	revisionsCount?: number;
	supportsRevisions?: boolean;
	isRevisionsMode?: boolean;
	disableVisualRevisions?: boolean;
};

function mockEditor( state: State ) {
	vi.mocked( useSelect ).mockReturnValue( {
		lastRevisionId: 12,
		revisionsCount: 3,
		supportsRevisions: true,
		isRevisionsMode: false,
		disableVisualRevisions: false,
		...state,
	} );
}

type Command = {
	name: string;
	label: string;
	callback: ( options: { close: () => void } ) => void;
};

function getCommands() {
	const { result } = renderHook( () => useRevisionsCommands() );
	return ( result.current as { commands: Command[] } ).commands;
}

describe( 'useRevisionsCommands', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( useDispatch ).mockReturnValue( { setCurrentRevisionId } );
	} );

	it( 'offers "Open revisions" when the post has revisions to compare', () => {
		mockEditor( {} );

		expect( getCommands() ).toEqual( [
			expect.objectContaining( {
				name: 'core/open-revisions',
				label: 'Open revisions',
			} ),
		] );
	} );

	it.each( [
		[ 'a single revision', { revisionsCount: 1 } ],
		[ 'no last revision', { lastRevisionId: null } ],
		[ 'a post type without revisions', { supportsRevisions: false } ],
		[ 'revisions already open', { isRevisionsMode: true } ],
	] )( 'offers nothing with %s', ( _, state ) => {
		mockEditor( state );

		expect( getCommands() ).toEqual( [] );
	} );

	it( 'opens the latest revision in the editor', () => {
		mockEditor( {} );
		const close = vi.fn();

		getCommands()[ 0 ].callback( { close } );

		expect( close ).toHaveBeenCalled();
		expect( setCurrentRevisionId ).toHaveBeenCalledWith( 12 );
	} );
} );
