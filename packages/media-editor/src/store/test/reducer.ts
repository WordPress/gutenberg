/**
 * Internal dependencies
 */
import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'core/media-editor reducer', () => {
	it( 'returns the default state for an unknown action', () => {
		const state = reducer( undefined, { type: '@@INIT' } );
		expect( state ).toEqual( DEFAULT_STATE );
	} );

	it( 'opens the modal with id and onUpdate', () => {
		const onUpdate = jest.fn();
		const state = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate,
		} );
		expect( state ).toEqual( {
			isOpen: true,
			id: 42,
			onUpdate,
		} );
	} );

	it( 'replaces state on a subsequent open (new onUpdate)', () => {
		const firstOnUpdate = jest.fn();
		const secondOnUpdate = jest.fn();
		const first = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate: firstOnUpdate,
		} );
		const second = reducer( first, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 99,
			onUpdate: secondOnUpdate,
		} );
		expect( second ).toEqual( {
			isOpen: true,
			id: 99,
			onUpdate: secondOnUpdate,
		} );
	} );

	it( 'clears state on close', () => {
		const opened = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate: jest.fn(),
		} );
		const closed = reducer( opened, {
			type: 'CLOSE_MEDIA_EDITOR_MODAL',
		} );
		expect( closed ).toEqual( DEFAULT_STATE );
	} );
} );
