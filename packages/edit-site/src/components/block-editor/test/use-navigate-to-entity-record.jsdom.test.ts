import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRegistry } from '@wordpress/data';
import useNavigateToEntityRecord from '../use-navigate-to-entity-record';

// Modules imported by the hook read `matchMedia` as they load.
vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const navigate = vi.fn();

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: () => ( {
		useHistory: () => ( { navigate } ),
		useLocation: () => ( { path: '/wp_template/tt5//home', query: {} } ),
	} ),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useRegistry: vi.fn(),
} ) );

function navigateTo( params: Record< string, unknown > ) {
	const { result } = renderHook( () => useNavigateToEntityRecord() );
	result.current( params );
	return navigate.mock.calls.at( -1 )?.[ 0 ];
}

describe( 'useNavigateToEntityRecord', () => {
	beforeEach( () => {
		navigate.mockClear();
		vi.mocked( useRegistry ).mockReturnValue( {
			select: () => ( {
				getCurrentPostType: () => 'wp_template',
				getCurrentPostId: () => 'tt5//home',
				getEntityRecordEdits: () => undefined,
			} ),
		} as unknown as ReturnType< typeof useRegistry > );
	} );

	it( 'opens the entity on a revision through the URL', () => {
		expect(
			navigateTo( {
				postType: 'wp_navigation',
				postId: 7,
				revisionId: 12,
			} )
		).toBe( '/wp_navigation/7?canvas=edit&focusMode=true&revision=12' );
	} );

	it.each( [ undefined, 0, -1, '12', 1.5 ] )(
		'ignores a revisionId of %s',
		( revisionId ) => {
			expect(
				navigateTo( {
					postType: 'wp_navigation',
					postId: 7,
					revisionId,
				} )
			).toBe( '/wp_navigation/7?canvas=edit&focusMode=true' );
		}
	);
} );
