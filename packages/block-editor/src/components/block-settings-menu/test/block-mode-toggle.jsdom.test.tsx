import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import BlockModeToggle from '../block-mode-toggle';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

// The mocked hook returns what each test sets up.
const mockedUseSelect = useSelect as unknown as Mock<
	( mapSelect: ( select: unknown ) => unknown ) => unknown
>;

function setupUseSelectMock(
	mode: string | undefined,
	blockType: Record< string, unknown >,
	codeEditingEnabled = true
) {
	mockedUseSelect.mockImplementation( () => {
		return {
			mode,
			blockType,
			enabled: codeEditingEnabled,
		};
	} );
}

describe( 'BlockModeToggle', () => {
	it( "should not render the HTML mode button if the block doesn't support it", () => {
		setupUseSelectMock( undefined, { supports: { html: false } } );
		// @ts-expect-error The mocked selectors need no client ID.
		render( <BlockModeToggle /> );

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit as HTML' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the HTML mode button', () => {
		setupUseSelectMock( 'visual', { supports: { html: true } } );
		// @ts-expect-error The mocked selectors need no client ID.
		render( <BlockModeToggle /> );

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit as HTML' } )
		).toBeVisible();
	} );

	it( 'should render the Visual mode button', () => {
		setupUseSelectMock( 'html', { supports: { html: true } } );
		// @ts-expect-error The mocked selectors need no client ID.
		render( <BlockModeToggle /> );

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit visually' } )
		).toBeVisible();
	} );

	it( 'should not render the Visual mode button if code editing is disabled', () => {
		setupUseSelectMock( 'html', { supports: { html: true } }, false );
		// @ts-expect-error The mocked selectors need no client ID.
		render( <BlockModeToggle /> );

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit visually' } )
		).not.toBeInTheDocument();
	} );
} );
