import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { store as coreStore } from '@wordpress/core-data';
import { isAppleOS } from '@wordpress/keycodes';
import { store as editorStore } from '../../../store';
import { createEditorRegistry, ExcerptEditor } from './fixtures/editor';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

function pressUndo( target: HTMLElement, redo = false ) {
	const event = new window.KeyboardEvent( 'keydown', {
		key: 'z',
		code: 'KeyZ',
		ctrlKey: ! isAppleOS(),
		metaKey: isAppleOS(),
		shiftKey: redo,
		bubbles: true,
		cancelable: true,
	} );
	fireEvent( target, event );
	return event;
}

describe( 'PostExcerpt undo', () => {
	it( 'leaves undo inside an uncommitted excerpt to the browser', async () => {
		const registry = await createEditorRegistry();
		render( <ExcerptEditor registry={ registry } updateOnBlur /> );
		const textarea = screen.getByRole( 'textbox' );
		fireEvent.change( textarea, { target: { value: 'Local draft' } } );

		const event = pressUndo( textarea );

		expect( event.defaultPrevented ).toBe( false );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Edited title' );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'excerpt' )
		).toBe( 'Original excerpt' );
	} );

	it( 'leaves redo inside an uncommitted excerpt to the browser', async () => {
		const registry = await createEditorRegistry();
		registry.dispatch( editorStore ).undo();
		render( <ExcerptEditor registry={ registry } updateOnBlur /> );
		const textarea = screen.getByRole( 'textbox' );
		fireEvent.change( textarea, { target: { value: 'Local draft' } } );

		const event = pressUndo( textarea, true );

		expect( event.defaultPrevented ).toBe( false );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Original title' );
	} );

	it( 'keeps editor undo for excerpts that update on each change', async () => {
		const registry = await createEditorRegistry();
		render( <ExcerptEditor registry={ registry } /> );
		const textarea = screen.getByRole( 'textbox' );
		fireEvent.change( textarea, { target: { value: 'Changed excerpt' } } );

		const event = pressUndo( textarea );

		expect( event.defaultPrevented ).toBe( true );
		expect( textarea ).toHaveValue( 'Original excerpt' );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Edited title' );
	} );

	it( 'keeps editor redo for excerpts that update on each change', async () => {
		const registry = await createEditorRegistry();
		render( <ExcerptEditor registry={ registry } /> );
		const textarea = screen.getByRole( 'textbox' );
		fireEvent.change( textarea, { target: { value: 'Changed excerpt' } } );
		pressUndo( textarea );

		const event = pressUndo( textarea, true );

		expect( event.defaultPrevented ).toBe( true );
		expect( textarea ).toHaveValue( 'Changed excerpt' );
	} );

	it( 'commits the local excerpt on blur and allows undo outside the field', async () => {
		const registry = await createEditorRegistry();
		render( <ExcerptEditor registry={ registry } updateOnBlur /> );
		const textarea = screen.getByRole( 'textbox' );
		fireEvent.change( textarea, { target: { value: 'Local draft' } } );
		fireEvent.blur( textarea );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'excerpt' )
		).toBe( 'Local draft' );

		const event = pressUndo( screen.getByRole( 'button' ) );

		expect( event.defaultPrevented ).toBe( true );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'excerpt' )
		).toBe( 'Original excerpt' );
	} );

	it( 'restores editor shortcuts when switching to immediate updates', async () => {
		const registry = await createEditorRegistry();
		const { rerender } = render(
			<ExcerptEditor registry={ registry } updateOnBlur />
		);
		rerender( <ExcerptEditor registry={ registry } /> );

		const event = pressUndo( screen.getByRole( 'textbox' ) );

		expect( event.defaultPrevented ).toBe( true );
		expect(
			registry.select( editorStore ).getEditedPostAttribute( 'title' )
		).toBe( 'Original title' );
	} );

	it( 'settles the preloaded post without making a REST request', async () => {
		const fetchSpy = vi.spyOn( globalThis, 'fetch' );
		try {
			const registry = await createEditorRegistry();
			await registry
				.resolveSelect( coreStore )
				.getEditedEntityRecord( 'postType', 'post', 1 );
			expect( fetchSpy ).not.toHaveBeenCalled();
		} finally {
			fetchSpy.mockRestore();
		}
	} );
} );
