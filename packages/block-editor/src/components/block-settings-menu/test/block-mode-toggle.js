/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockModeToggle from '../block-mode-toggle';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

function setupUseSelectMock( mode, blockType, codeEditingEnabled = true ) {
	useSelect.mockImplementation( () => {
		return {
			mode,
			blockType,
			isCodeEditingEnabled: codeEditingEnabled,
		};
	} );
}

describe( 'BlockModeToggle', () => {
	it( "should not render the HTML mode button if the block doesn't support it", () => {
		setupUseSelectMock( undefined, { supports: { html: false } } );
		render( <BlockModeToggle /> );

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit as HTML' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the HTML mode button', () => {
		setupUseSelectMock( 'visual', { supports: { html: true } } );
		render( <BlockModeToggle /> );

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit as HTML' } )
		).toBeVisible();
	} );

	it( 'should render the Visual mode button', () => {
		setupUseSelectMock( 'html', { supports: { html: true } } );
		render( <BlockModeToggle /> );

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit visually' } )
		).toBeVisible();
	} );

	it( 'should not render the Visual mode button if code editing is disabled', () => {
		setupUseSelectMock( 'html', { supports: { html: true } }, false );
		render( <BlockModeToggle /> );

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit visually' } )
		).not.toBeInTheDocument();
	} );
} );
