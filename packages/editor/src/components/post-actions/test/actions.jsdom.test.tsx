import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePostActions } from '../actions';
import { useEntityActions } from '../../../dataviews/entity-actions-loader';

vi.mock( import( '../../../dataviews/entity-actions-loader' ), () => ( {
	useEntityActions: vi.fn(),
} ) );

function getActionIds( context?: string ) {
	vi.mocked( useEntityActions ).mockReturnValue( {
		actions: [
			{ id: 'everywhere', label: 'Everywhere' },
			{ id: 'list-only', label: 'List only', context: 'list' },
			{ id: 'single-only', label: 'Single only', context: 'single' },
		],
	} as ReturnType< typeof useEntityActions > );
	const { result } = renderHook( () =>
		usePostActions( { postType: 'page', context } )
	);
	return result.current.map( ( action: { id: string } ) => action.id );
}

describe( 'usePostActions', () => {
	it( 'returns the list actions and the actions without a context for the list context', () => {
		expect( getActionIds( 'list' ) ).toEqual( [
			'everywhere',
			'list-only',
		] );
	} );

	it( 'returns the single actions and the actions without a context for the single context', () => {
		expect( getActionIds( 'single' ) ).toEqual( [
			'everywhere',
			'single-only',
		] );
	} );

	it( 'returns only the actions without a context when no context is provided', () => {
		expect( getActionIds( undefined ) ).toEqual( [ 'everywhere' ] );
	} );
} );
