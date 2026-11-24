import {
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockInstance,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '../../../store';
import { FlatTermSelector } from '../flat-term-selector';

vi.mock( import( '@wordpress/api-fetch' ) );

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'FlatTermSelector', () => {
	const tagsTaxonomy = {
		name: 'Tags',
		slug: 'post_tag',
		types: [ 'post' ],
		hierarchical: false,
		rest_base: 'tags',
		visibility: {
			show_ui: true,
		},
		labels: {
			add_new_item: 'Add Tag',
			singular_name: 'Tag',
		},
	};

	let editPostSpy: MockInstance;
	let saveEntityRecordSpy: MockInstance;
	let createErrorNoticeSpy: MockInstance;

	beforeEach( () => {
		vi.restoreAllMocks();

		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-create-tags': [
					{ href: 'http://localhost/wp-json/wp/v2/tags' },
				],
				'wp:action-assign-tags': [
					{ href: 'http://localhost/wp-json/wp/v2/tags' },
				],
			},
		} );
		vi.spyOn(
			select( editorStore ),
			'getEditedPostAttribute'
		).mockReturnValue( [] );
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockReturnValue(
			tagsTaxonomy
		);
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[]
		);
		vi.spyOn(
			select( coreStore ),
			'hasFinishedResolution'
		).mockReturnValue( true );

		editPostSpy = vi
			.spyOn( dispatch( editorStore ), 'editPost' )
			.mockImplementation( () => {} );
		saveEntityRecordSpy = vi.spyOn(
			dispatch( coreStore ),
			'saveEntityRecord'
		);
		createErrorNoticeSpy = vi
			.spyOn( dispatch( noticesStore ), 'createErrorNotice' )
			.mockImplementation( () => {} );
	} );

	it( 'locks post saving and autosaving while a new tag is being created and unlocks after assigning it', async () => {
		const user = userEvent.setup();
		let resolveCreate!: ( value: { id: number; name: string } ) => void;
		saveEntityRecordSpy.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolveCreate = resolve;
				} )
		);

		render( <FlatTermSelector slug="post_tag" /> );

		const input = screen.getByRole( 'combobox', { name: 'Add Tag' } );
		await user.type( input, 'New Tag{Enter}' );

		expect( select( editorStore ).isPostSavingLocked() ).toBe( true );
		expect( select( editorStore ).isPostAutosavingLocked() ).toBe( true );
		expect( editPostSpy ).not.toHaveBeenCalled();

		resolveCreate( { id: 42, name: 'New Tag' } );

		await waitFor( () => {
			expect( select( editorStore ).isPostSavingLocked() ).toBe( false );
		} );
		expect( select( editorStore ).isPostAutosavingLocked() ).toBe( false );
		expect( editPostSpy ).toHaveBeenCalledWith( { tags: [ 42 ] } );
	} );

	it( 'unlocks post saving and autosaving when creating a new tag fails', async () => {
		const user = userEvent.setup();
		let rejectCreate!: ( reason?: unknown ) => void;
		saveEntityRecordSpy.mockImplementation(
			() =>
				new Promise( ( _resolve, reject ) => {
					rejectCreate = reject;
				} )
		);

		render( <FlatTermSelector slug="post_tag" /> );

		const input = screen.getByRole( 'combobox', { name: 'Add Tag' } );
		await user.type( input, 'Broken Tag{Enter}' );

		expect( select( editorStore ).isPostSavingLocked() ).toBe( true );
		expect( select( editorStore ).isPostAutosavingLocked() ).toBe( true );

		rejectCreate( new Error( 'Network error' ) );

		await waitFor( () => {
			expect( select( editorStore ).isPostSavingLocked() ).toBe( false );
		} );
		expect( select( editorStore ).isPostAutosavingLocked() ).toBe( false );
		expect( createErrorNoticeSpy ).toHaveBeenCalledWith( 'Network error', {
			type: 'snackbar',
		} );
		expect( editPostSpy ).not.toHaveBeenCalled();
	} );

	it( 'keeps post saving locked until all concurrent new tag creations complete', async () => {
		const user = userEvent.setup();
		const resolvers: Record<
			string,
			( value: { id: number; name: string } ) => void
		> = {};
		saveEntityRecordSpy.mockImplementation(
			( _kind: string, _name: string, { name }: { name: string } ) =>
				new Promise( ( resolve ) => {
					resolvers[ name ] = resolve;
				} )
		);

		render( <FlatTermSelector slug="post_tag" /> );

		const input = screen.getByRole( 'combobox', { name: 'Add Tag' } );
		await user.type( input, 'First Tag, Second Tag{Enter}' );

		expect( select( editorStore ).isPostSavingLocked() ).toBe( true );

		resolvers[ 'First Tag' ]( { id: 10, name: 'First Tag' } );

		await waitFor( () => {
			expect( editPostSpy ).toHaveBeenCalledWith( { tags: [ 10 ] } );
		} );
		// Still locked because Second Tag has not resolved yet.
		expect( select( editorStore ).isPostSavingLocked() ).toBe( true );

		resolvers[ 'Second Tag' ]( { id: 11, name: 'Second Tag' } );

		await waitFor( () => {
			expect( select( editorStore ).isPostSavingLocked() ).toBe( false );
		} );
		expect( select( editorStore ).isPostAutosavingLocked() ).toBe( false );
	} );
} );
