/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { BlockModeToggle } from '../block-mode-toggle';

describe( 'BlockModeToggle', () => {
	it( "should not render the HTML mode button if the block doesn't support it", () => {
		render(
			<BlockModeToggle blockType={ { supports: { html: false } } } />
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit as HTML' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the HTML mode button', () => {
		render(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="visual"
			/>
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit as HTML' } )
		).toBeVisible();
	} );

	it( 'should render the Visual mode button', () => {
		render(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="html"
			/>
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit visually' } )
		).toBeVisible();
	} );

	it( 'should not render the Visual mode button if code editing is disabled', () => {
		render(
			<BlockModeToggle
				blockType={ { supports: { html: true } } }
				mode="html"
				isCodeEditingEnabled={ false }
			/>
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit visually' } )
		).not.toBeInTheDocument();
	} );
} );
