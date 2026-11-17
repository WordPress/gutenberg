import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import useNavigateToEntityRecord from '../use-navigate-to-entity-record';

// Modules imported by the hook read `matchMedia` as they load.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useDispatch: vi.fn(),
	useRegistry: vi.fn(),
	useSelect: vi.fn(),
} ) );

vi.mock( import( '../../lock-unlock' ), async ( importOriginal ) => {
	const original = await importOriginal();
	const { unlock } = original;
	return {
		...original,
		// The mocked `useDispatch` result isn't a locked object.
		unlock: ( object ) => {
			try {
				return unlock( object );
			} catch {
				return object;
			}
		},
	};
} );

const openRevisionOfPost = vi.fn();
const setRenderingMode = vi.fn();

function renderNavigate() {
	return renderHook( () =>
		useNavigateToEntityRecord( 1, 'post', 'post-only' )
	);
}

describe( 'useNavigateToEntityRecord', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		vi.mocked( useSelect ).mockReturnValue( {
			getRenderingMode: () => 'template-locked',
		} );
		vi.mocked( useDispatch ).mockReturnValue( {
			openRevisionOfPost,
			setRenderingMode,
			editEntityRecord: vi.fn(),
		} );
		vi.mocked( useRegistry ).mockReturnValue( {
			select: () => ( { getEntityRecordEdits: () => undefined } ),
		} );
	} );

	it( 'opens the entity and queues its revision', () => {
		const { result } = renderNavigate();

		act( () => {
			result.current.onNavigateToEntityRecord( {
				postType: 'wp_navigation',
				postId: 7,
				revisionId: 12,
			} );
		} );

		expect( result.current.currentPost ).toMatchObject( {
			postType: 'wp_navigation',
			postId: 7,
		} );
		expect( openRevisionOfPost ).toHaveBeenCalledWith( {
			postType: 'wp_navigation',
			postId: 7,
			revisionId: 12,
		} );
	} );

	it( 'does not queue a revision when none is asked for', () => {
		const { result } = renderNavigate();

		act( () => {
			result.current.onNavigateToEntityRecord( {
				postType: 'wp_navigation',
				postId: 7,
			} );
		} );

		expect( openRevisionOfPost ).not.toHaveBeenCalled();
	} );
} );
