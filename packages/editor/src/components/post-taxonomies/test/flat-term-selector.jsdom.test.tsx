/**
 * Tests for the two reliability fixes in FlatTermSelector.createTerm:
 *  1. In-flight creations are de-duplicated by name, so the same name isn't
 *     created (and POSTed) twice when its creation is triggered again before
 *     the first request resolves.
 *  2. A failed creation restores the typed name to the input instead of
 *     silently discarding it, so the writer doesn't lose what they typed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { dispatch, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';
import { FlatTermSelector } from '../flat-term-selector';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

type CreateItem = { value: string; label?: string };
type CapturedControlProps = {
	inputValue: string;
	onInputValueChange: ( value: string ) => void;
	onValueChange: ( value: CreateItem[] ) => void;
};

// Replace the heavy chip-select with a passthrough that records its props, so
// the container's own logic can be driven directly (onInputValueChange /
// onValueChange) without depending on the control's internal DOM. Everything
// else exported from @wordpress/ui is kept as-is.
let controlProps: CapturedControlProps | undefined;
vi.mock( '@wordpress/ui', async ( importActual ) => {
	const actual = await importActual< typeof import( '@wordpress/ui' ) >();
	return {
		...actual,
		SearchableChipSelectControl: ( props: CapturedControlProps ) => {
			controlProps = props;
			return null;
		},
	};
} );

// The internal sentinel value the create item carries. Kept in sync with the
// component; if it changes there, this constant changes with it.
const CREATE_TERM_VALUE = '__create__';

// A stable empty array — returned by reference so useSelect sees a consistent
// value across renders (a fresh [] each call trips the hook's stability warning).
const NO_TAGS: number[] = [];

const postTagTaxonomy = {
	name: 'Tags',
	slug: 'post_tag',
	rest_base: 'tags',
	hierarchical: false,
	labels: { add_new_item: 'Add Tag', singular_name: 'Tag' },
};

// A resolvable promise handle, so the test controls exactly when a creation
// resolves or rejects relative to other interactions.
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason?: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

describe( 'FlatTermSelector create reliability', () => {
	beforeEach( () => {
		controlProps = undefined;

		vi.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {
				'wp:action-create-tags': [ { href: '/wp/v2/tags' } ],
				'wp:action-assign-tags': [ { href: '/wp/v2/tags' } ],
			},
		} as never );
		vi.spyOn(
			select( editorStore ),
			'getEditedPostAttribute'
		).mockImplementation( ( ( attr: string ) =>
			attr === 'tags' ? NO_TAGS : undefined ) as never );
		vi.spyOn( select( coreStore ), 'getEntityRecord' ).mockImplementation(
			( ( kind: string, name: string, slug: string ) =>
				kind === 'root' && name === 'taxonomy' && slug === 'post_tag'
					? postTagTaxonomy
					: undefined ) as never
		);
		vi.spyOn( select( coreStore ), 'getEntityRecords' ).mockReturnValue(
			[] as never
		);
		vi.spyOn(
			select( coreStore ),
			'hasFinishedResolution'
		).mockReturnValue( true as never );

		vi.spyOn( dispatch( editorStore ), 'editPost' ).mockReturnValue(
			undefined as never
		);
		vi.spyOn(
			dispatch( noticesStore ),
			'createErrorNotice'
		).mockReturnValue( undefined as never );
	} );

	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'creates a name only once when its creation is triggered twice in flight', async () => {
		const create = deferred< { id: number; name: string } >();
		const saveEntityRecord = vi
			.spyOn( dispatch( coreStore ), 'saveEntityRecord' )
			.mockReturnValue( create.promise as never );

		render( <FlatTermSelector slug="post_tag" /> );

		act( () => {
			controlProps!.onInputValueChange( 'jazz' );
		} );
		// Two create picks for the same name, before the first request resolves.
		act( () => {
			controlProps!.onValueChange( [ { value: CREATE_TERM_VALUE } ] );
		} );
		act( () => {
			controlProps!.onValueChange( [ { value: CREATE_TERM_VALUE } ] );
		} );

		expect( saveEntityRecord ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			create.resolve( { id: 7, name: 'jazz' } );
		} );
	} );

	it( 'restores the typed name to the input when creation fails', async () => {
		const create = deferred< { id: number; name: string } >();
		vi.spyOn( dispatch( coreStore ), 'saveEntityRecord' ).mockReturnValue(
			create.promise as never
		);

		render( <FlatTermSelector slug="post_tag" /> );

		act( () => {
			controlProps!.onInputValueChange( 'jazz' );
		} );
		act( () => {
			controlProps!.onValueChange( [ { value: CREATE_TERM_VALUE } ] );
		} );
		// The control clears its input once a value is picked.
		act( () => {
			controlProps!.onInputValueChange( '' );
		} );
		expect( controlProps!.inputValue ).toBe( '' );

		// The creation fails.
		await act( async () => {
			create.reject( {
				code: 'rest_cannot_create',
				message: 'Sorry, you are not allowed.',
			} );
		} );

		// The typed name is handed back to the input rather than lost…
		expect( controlProps!.inputValue ).toBe( 'jazz' );
		// …and the failure is surfaced.
		expect(
			dispatch( noticesStore ).createErrorNotice
		).toHaveBeenCalledWith( 'Sorry, you are not allowed.', {
			type: 'snackbar',
		} );
	} );

	it( 'treats term_exists as success — assigns the existing id, leaves the input cleared', async () => {
		const create = deferred< { id: number; name: string } >();
		vi.spyOn( dispatch( coreStore ), 'saveEntityRecord' ).mockReturnValue(
			create.promise as never
		);

		render( <FlatTermSelector slug="post_tag" /> );

		act( () => {
			controlProps!.onInputValueChange( 'jazz' );
		} );
		act( () => {
			controlProps!.onValueChange( [ { value: CREATE_TERM_VALUE } ] );
		} );
		act( () => {
			controlProps!.onInputValueChange( '' );
		} );

		await act( async () => {
			create.reject( { code: 'term_exists', data: { term_id: 42 } } );
		} );

		// A term that already exists is assigned by id, not re-created; nothing is
		// restored to the input and no error is raised.
		expect( controlProps!.inputValue ).toBe( '' );
		expect(
			dispatch( noticesStore ).createErrorNotice
		).not.toHaveBeenCalled();
		expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith( {
			tags: [ 42 ],
		} );
	} );
} );
