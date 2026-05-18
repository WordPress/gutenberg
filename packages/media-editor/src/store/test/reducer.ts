/**
 * Internal dependencies
 */
import reducer, { DEFAULT_STATE } from '../reducer';

describe( 'core/media-editor reducer', () => {
	it( 'returns the default state for an unknown action', () => {
		const state = reducer( undefined, { type: '@@INIT' } );
		expect( state ).toEqual( DEFAULT_STATE );
	} );

	it( 'opens the modal in edit mode with id and onUpdate', () => {
		const onUpdate = jest.fn();
		const state = reducer( undefined, {
			type: 'OPEN_MEDIA_EDITOR_MODAL',
			id: 42,
			onUpdate,
		} );
		expect( state ).toEqual( {
			isOpen: true,
			mode: 'edit',
			id: 42,
			onUpdate,
			browse: null,
			returnToBrowse: false,
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
			mode: 'edit',
			id: 99,
			onUpdate: secondOnUpdate,
			browse: null,
			returnToBrowse: false,
		} );
	} );

	it( 'clears state on close (edit)', () => {
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

	describe( 'browse mode', () => {
		const browse = {
			config: { multiple: false },
			callbacks: { onSelect: jest.fn() },
			value: null,
			session: Symbol( 'test-session' ),
		};

		it( 'opens the modal in browse mode', () => {
			const state = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			expect( state ).toEqual( {
				isOpen: true,
				mode: 'browse',
				id: null,
				onUpdate: null,
				browse,
				returnToBrowse: false,
			} );
		} );

		it( 'closes browse when the owning session calls close', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const closed = reducer( opened, {
				type: 'CLOSE_MEDIA_UPLOAD_MODAL',
				session: browse.session,
			} );
			expect( closed ).toEqual( DEFAULT_STATE );
		} );

		it( 'ignores close from a superseded session', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const closed = reducer( opened, {
				type: 'CLOSE_MEDIA_UPLOAD_MODAL',
				session: Symbol( 'other-session' ),
			} );
			expect( closed ).toBe( opened );
		} );

		it( 'closes browse when a null session is passed (force close)', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const closed = reducer( opened, {
				type: 'CLOSE_MEDIA_UPLOAD_MODAL',
				session: null,
			} );
			expect( closed ).toEqual( DEFAULT_STATE );
		} );

		it( 'updates value on SELECT_MEDIA_IN_BROWSER', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const selected = reducer( opened, {
				type: 'SELECT_MEDIA_IN_BROWSER',
				value: 42,
			} );
			expect( selected.browse?.value ).toBe( 42 );
			expect( selected.browse?.session ).toBe( browse.session );
		} );

		it( 'ignores SELECT_MEDIA_IN_BROWSER when not in browse', () => {
			const state = reducer( undefined, {
				type: 'SELECT_MEDIA_IN_BROWSER',
				value: 42,
			} );
			expect( state ).toEqual( DEFAULT_STATE );
		} );
	} );

	describe( 'browse → edit transitions', () => {
		const browse = {
			config: { multiple: false },
			callbacks: { onSelect: jest.fn() },
			value: 42,
			session: Symbol( 'test-session' ),
		};

		it( 'enters edit mode preserving browse state', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const editing = reducer( opened, {
				type: 'ENTER_EDIT_MODE',
				id: 42,
			} );
			expect( editing ).toEqual( {
				isOpen: true,
				mode: 'edit',
				id: 42,
				onUpdate: null,
				browse,
				returnToBrowse: true,
			} );
		} );

		it( 'ignores ENTER_EDIT_MODE when not in browse', () => {
			const state = reducer( undefined, {
				type: 'ENTER_EDIT_MODE',
				id: 42,
			} );
			expect( state ).toEqual( DEFAULT_STATE );
		} );

		it( 'exits edit mode back to browse, preserving browse state', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_UPLOAD_MODAL',
				browse,
			} );
			const editing = reducer( opened, {
				type: 'ENTER_EDIT_MODE',
				id: 42,
			} );
			const exited = reducer( editing, { type: 'EXIT_EDIT_MODE' } );
			expect( exited ).toEqual( {
				isOpen: true,
				mode: 'browse',
				id: null,
				onUpdate: null,
				browse,
				returnToBrowse: false,
			} );
		} );

		it( 'EXIT_EDIT_MODE without returnToBrowse fully closes', () => {
			const opened = reducer( undefined, {
				type: 'OPEN_MEDIA_EDITOR_MODAL',
				id: 42,
				onUpdate: jest.fn(),
			} );
			const exited = reducer( opened, { type: 'EXIT_EDIT_MODE' } );
			expect( exited ).toEqual( DEFAULT_STATE );
		} );
	} );
} );
