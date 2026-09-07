import { describe, expect, it, vi } from 'vitest';
import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'core/media-editor reducer', () => {
	it( 'returns the default state for an unknown action', () => {
		const state = reducer( undefined, { type: '@@INIT' } );
		expect( state ).toEqual( DEFAULT_STATE );
	} );

	it( 'opens the modal with id and onUpdate', () => {
		const onUpdate = vi.fn();
		const onClose = vi.fn();
		const state = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate,
			onClose,
		} );
		expect( state ).toEqual( {
			isOpen: true,
			id: 42,
			onUpdate,
			onClose,
		} );
	} );

	it( 'replaces state on a subsequent open (new onUpdate)', () => {
		const firstOnUpdate = vi.fn();
		const firstOnClose = vi.fn();
		const secondOnUpdate = vi.fn();
		const secondOnClose = vi.fn();
		const first = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate: firstOnUpdate,
			onClose: firstOnClose,
		} );
		const second = reducer( first, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 99,
			onUpdate: secondOnUpdate,
			onClose: secondOnClose,
		} );
		expect( second ).toEqual( {
			isOpen: true,
			id: 99,
			onUpdate: secondOnUpdate,
			onClose: secondOnClose,
		} );
	} );

	it( 'clears state on close', () => {
		const opened = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate: vi.fn(),
			onClose: vi.fn(),
		} );
		const closed = reducer( opened, {
			type: 'CLOSE_MEDIA_EDITOR_MODAL',
		} );
		expect( closed ).toEqual( DEFAULT_STATE );
	} );
} );
