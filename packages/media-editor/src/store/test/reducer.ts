/**
 * Internal dependencies
 */
import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'core/media-editor reducer', () => {
	it( 'returns the default state for an unknown action', () => {
		const state = reducer( undefined, { type: '@@INIT' } );
		expect( state ).toEqual( DEFAULT_STATE );
	} );

	it( 'opens the modal with attachmentId and invocationId', () => {
		const state = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			attachmentId: 42,
			invocationId: 1,
		} );
		expect( state ).toEqual( {
			isOpen: true,
			attachmentId: 42,
			invocationId: 1,
		} );
	} );

	it( 'replaces state on a subsequent open (new invocationId)', () => {
		const first = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			attachmentId: 42,
			invocationId: 1,
		} );
		const second = reducer( first, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			attachmentId: 99,
			invocationId: 2,
		} );
		expect( second ).toEqual( {
			isOpen: true,
			attachmentId: 99,
			invocationId: 2,
		} );
	} );

	it( 'clears state on close', () => {
		const opened = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			attachmentId: 42,
			invocationId: 1,
		} );
		const closed = reducer( opened, {
			type: 'CLOSE_MEDIA_EDITOR_MODAL',
		} );
		expect( closed ).toEqual( DEFAULT_STATE );
	} );
} );
