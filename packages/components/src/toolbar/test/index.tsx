/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { Toolbar, ToolbarButton } from '..';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', async () => {
			await render(
				<Toolbar label="blocks">
					<ToolbarButton label="control1" />
					<ToolbarButton label="control2" />
				</Toolbar>
			);

			expect(
				screen.getByLabelText( 'control1', { selector: 'button' } )
			).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'control2', { selector: 'button' } )
			).toBeInTheDocument();
		} );

		it( 'should apply the unstyled variant correctly via the `variant` prop', async () => {
			await render( <Toolbar label="blocks" variant="unstyled" /> );

			expect( screen.getByRole( 'toolbar' ) ).toHaveClass(
				'is-unstyled'
			);
		} );
	} );
} );
