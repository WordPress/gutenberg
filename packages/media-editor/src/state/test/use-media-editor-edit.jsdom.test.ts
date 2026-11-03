import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MediaEditorStateProvider, useMediaEditor } from '..';
import { useMediaEditorEdit } from '../use-media-editor-edit';

const NAME = 'test/vignette';
const DEFAULT = { amount: 0 };

function setupHook() {
	return renderHook(
		() => ( {
			edit: useMediaEditorEdit( NAME, DEFAULT ),
			session: useMediaEditor(),
		} ),
		{ wrapper: MediaEditorStateProvider }
	);
}

describe( 'useMediaEditorEdit', () => {
	it( 'reports the default while the edit is not set', () => {
		const { result } = setupHook();

		expect( result.current.edit.value ).toEqual( DEFAULT );
		expect( result.current.session.edits ).toEqual( {} );
	} );

	it( 'records the value in the session', () => {
		const { result } = setupHook();

		act( () => result.current.edit.setValue( { amount: 0.5 } ) );

		expect( result.current.edit.value ).toEqual( { amount: 0.5 } );
		expect( result.current.session.edits ).toEqual( {
			[ NAME ]: { amount: 0.5 },
		} );
		expect( result.current.session.isDirty ).toBe( true );
	} );

	it( 'removes the edit when set back to a value equal to the default', () => {
		const { result } = setupHook();

		act( () => result.current.edit.setValue( { amount: 0.5 } ) );
		act( () => result.current.edit.setValue( { amount: 0 } ) );

		expect( result.current.edit.value ).toEqual( DEFAULT );
		expect( result.current.session.edits ).toEqual( {} );
		expect( result.current.session.isDirty ).toBe( false );
	} );

	it( 'groups the changes made during a gesture into one undo entry', () => {
		const { result } = setupHook();

		act( () => result.current.edit.beginGesture() );
		act( () => result.current.edit.setValue( { amount: 0.2 } ) );
		act( () => result.current.edit.setValue( { amount: 0.4 } ) );
		act( () => result.current.edit.endGesture() );

		expect( result.current.edit.value ).toEqual( { amount: 0.4 } );

		act( () => result.current.session.undo() );

		expect( result.current.edit.value ).toEqual( DEFAULT );
		expect( result.current.session.hasUndo ).toBe( false );
	} );
} );
