/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import {
	useActiveCollaborators,
	useResolvedSelection,
	useGetDebugData,
	useIsDisconnected,
	useOnCollaboratorJoin,
	useOnCollaboratorLeave,
	useOnPostSave,
} from '../use-post-editor-awareness-state';
import { SelectionType } from '../../types';

describe( 'use-post-editor-awareness-state hooks', () => {
	it( 'returns no active collaborators', () => {
		const { result, rerender } = renderHook( () =>
			useActiveCollaborators( 123, 'post' )
		);
		const firstResult = result.current;
		rerender();

		expect( result.current ).toEqual( [] );
		expect( result.current ).toBe( firstResult );
	} );

	it( 'returns the default resolved selection', () => {
		const { result, rerender } = renderHook( () =>
			useResolvedSelection( 123, 'post' )
		);
		const firstResult = result.current;
		rerender();

		expect(
			result.current( {
				type: SelectionType.None,
			} )
		).toEqual( {
			richTextOffset: null,
			localClientId: null,
		} );
		expect( result.current ).toBe( firstResult );
	} );

	it( 'returns empty debug data', () => {
		const { result } = renderHook( () => useGetDebugData( 123, 'post' ) );

		expect( result.current ).toEqual( {
			doc: {},
			clients: {},
			collaboratorMap: {},
		} );
	} );

	it( 'reports the current collaborator as connected', () => {
		const { result } = renderHook( () => useIsDisconnected( 123, 'post' ) );

		expect( result.current ).toBe( false );
	} );

	it( 'does not call collaborator callbacks', () => {
		const onJoin = jest.fn();
		const onLeave = jest.fn();
		const onSave = jest.fn();

		renderHook( () => {
			useOnCollaboratorJoin( 123, 'post', onJoin );
			useOnCollaboratorLeave( 123, 'post', onLeave );
			useOnPostSave( 123, 'post', onSave );
		} );

		expect( onJoin ).not.toHaveBeenCalled();
		expect( onLeave ).not.toHaveBeenCalled();
		expect( onSave ).not.toHaveBeenCalled();
	} );
} );
