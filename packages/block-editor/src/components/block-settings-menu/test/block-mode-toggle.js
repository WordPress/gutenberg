/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { BlockModeToggle } from '../block-mode-toggle';
import { unlock } from '../../../lock-unlock';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

describe( 'BlockModeToggle', () => {
	it( "should not render the HTML mode button if the block doesn't support it", () => {
		render(
			<DropdownMenuV2 defaultOpen>
				<BlockModeToggle blockType={ { supports: { html: false } } } />
			</DropdownMenuV2>
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit as HTML' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render the HTML mode button', () => {
		render(
			<DropdownMenuV2 defaultOpen>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="visual"
				/>
			</DropdownMenuV2>
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit as HTML' } )
		).toBeVisible();
	} );

	it( 'should render the Visual mode button', () => {
		render(
			<DropdownMenuV2 defaultOpen>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="html"
				/>
			</DropdownMenuV2>
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Edit visually' } )
		).toBeVisible();
	} );

	it( 'should not render the Visual mode button if code editing is disabled', () => {
		render(
			<DropdownMenuV2 defaultOpen>
				<BlockModeToggle
					blockType={ { supports: { html: true } } }
					mode="html"
					isCodeEditingEnabled={ false }
				/>
			</DropdownMenuV2>
		);

		expect(
			screen.queryByRole( 'menuitem', { name: 'Edit visually' } )
		).not.toBeInTheDocument();
	} );
} );
