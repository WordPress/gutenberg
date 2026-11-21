import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
	registerBlockType,
	setDefaultBlockName,
	unregisterBlockType,
} from '@wordpress/blocks';
import { __unstableUseAutocompleteProps as useAutocompleteProps } from '@wordpress/components';
import { BlockEditContextProvider } from '../../block-edit/context';
import blockAutocompleter from '../../../autocompleters/block';
import { useBlockEditorAutocompleteProps } from '..';

// Spy on the hook to read the completers and `onReplace` it receives.
vi.mock( import( '@wordpress/components' ), { spy: true } );
const mockedUseAutocompleteProps = vi.mocked( useAutocompleteProps );

const record = { text: '', formats: [], replacements: [], start: 0, end: 0 };

function wrapper( { children }: { children: ReactNode } ) {
	return (
		<BlockEditContextProvider value={ { name: 'core/paragraph' } }>
			{ children }
		</BlockEditContextProvider>
	);
}

function getPassedProps() {
	return mockedUseAutocompleteProps.mock.lastCall![ 0 ];
}

describe( 'useBlockEditorAutocompleteProps', () => {
	beforeAll( () => {
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			save: () => null,
			category: 'text',
			title: 'Paragraph',
			attributes: {},
		} );
		setDefaultBlockName( 'core/paragraph' );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/paragraph' );
	} );

	beforeEach( () => {
		mockedUseAutocompleteProps.mockClear();
	} );

	it( 'should add the block completer to the default block', () => {
		const onReplace = vi.fn();

		renderHook(
			() =>
				useBlockEditorAutocompleteProps( {
					onReplace,
					record,
					onChange: () => {},
				} ),
			{ wrapper }
		);

		const { completers, onReplace: passedOnReplace } = getPassedProps();
		expect( completers ).toContain( blockAutocompleter );
		expect( passedOnReplace ).toBe( onReplace );
	} );

	it( 'should not add the block completer when the block cannot be replaced', () => {
		renderHook(
			() =>
				useBlockEditorAutocompleteProps( {
					record,
					onChange: () => {},
				} ),
			{ wrapper }
		);

		const { completers, onReplace } = getPassedProps();
		expect( completers ).not.toContain( blockAutocompleter );
		// Other completers can still replace without throwing.
		expect( () => onReplace( [] ) ).not.toThrow();
	} );
} );
