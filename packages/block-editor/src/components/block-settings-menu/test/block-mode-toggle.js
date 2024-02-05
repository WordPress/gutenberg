/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BlockModeToggle } from '../block-mode-toggle';
import { unlock } from '../../../lock-unlock';

const { DropdownMenuV2: DropdownMenu } = unlock( componentsPrivateApis );

describe( 'BlockModeToggle', () => {
	it( "should not render the HTML mode button if the block doesn't support it", async () => {
		render(
			<DropdownMenu open>
				<BlockModeToggle blockType={ { supports: { html: false } } } />
			</DropdownMenu>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'menu' ) ).toBeVisible()
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit as HTML' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the HTML mode button', async () => {
		render(
			<DropdownMenu open>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="visual"
				/>
			</DropdownMenu>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'menu' ) ).toBeVisible()
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit as HTML' } )
		).toBeVisible();
	} );

	it( 'should render the Visual mode button', async () => {
		render(
			<DropdownMenu open>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="html"
				/>
			</DropdownMenu>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'menu' ) ).toBeVisible()
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit visually' } )
		).toBeVisible();
	} );

	it( 'should not render the Visual mode button if code editing is disabled', async () => {
		render(
			<DropdownMenu open>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="html"
					isCodeEditingEnabled={ false }
				/>
			</DropdownMenu>
		);

		await waitFor( () =>
			expect( screen.getByRole( 'menu' ) ).toBeVisible()
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit visually' } )
		).not.toBeInTheDocument();
	} );
} );
