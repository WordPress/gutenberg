/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import UploadPromptHost, { useHasActiveUploadPrompt } from '../';

let mockPrompts = [];

// The host reads pending prompts from the (private) upload store; stub the
// selector layer so the test controls the prompt list directly.
jest.mock( '@wordpress/data', () => ( {
	useSelect: ( mapSelect ) => mapSelect( () => ( {} ) ),
} ) );

// Avoid loading the real upload-media store (registers a data store on
// import); its value is irrelevant here since unlock() is stubbed below.
jest.mock( '@wordpress/upload-media', () => ( {
	store: 'core/upload-media',
} ) );

jest.mock( '../../../lock-unlock', () => ( {
	unlock: () => ( {
		getUploadPrompts: () => mockPrompts,
	} ),
} ) );

// Render a recognisable stand-in for the GIF conversion prompt so the test
// asserts the host mapped the 'gif-conversion' type to it, without pulling in
// the real modal (and its store dependencies).
jest.mock( '../../gif-conversion-prompt', () => ( {
	GifConversionPrompt: ( { prompt } ) => (
		<div data-testid="gif-conversion-prompt">{ prompt.itemId }</div>
	),
} ) );

describe( 'UploadPromptHost', () => {
	afterEach( () => {
		mockPrompts = [];
	} );

	it( 'renders the component registered for each prompt type', () => {
		mockPrompts = [
			{ id: 'p1', type: 'gif-conversion', itemId: 'item-1' },
			{ id: 'p2', type: 'gif-conversion', itemId: 'item-2' },
		];

		render( <UploadPromptHost /> );

		const rendered = screen.getAllByTestId( 'gif-conversion-prompt' );
		expect( rendered ).toHaveLength( 2 );
		expect( rendered.map( ( el ) => el.textContent ) ).toEqual( [
			'item-1',
			'item-2',
		] );
	} );

	it( 'ignores prompts whose type has no registered component', () => {
		mockPrompts = [ { id: 'p1', type: 'unknown-prompt' } ];

		render( <UploadPromptHost /> );

		expect(
			screen.queryByTestId( 'gif-conversion-prompt' )
		).not.toBeInTheDocument();
	} );

	it( 'useHasActiveUploadPrompt reflects whether any prompt is pending', () => {
		mockPrompts = [];
		expect( useHasActiveUploadPrompt() ).toBe( false );

		mockPrompts = [ { id: 'p1', type: 'gif-conversion' } ];
		expect( useHasActiveUploadPrompt() ).toBe( true );
	} );
} );
