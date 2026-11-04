import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toolbar, ToolbarButton } from '..';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', async () => {
			render(
				<Toolbar label="blocks">
					<ToolbarButton label="control1" />
					<ToolbarButton label="control2" />
				</Toolbar>
			);

			expect(
				await screen.findByLabelText( 'control1', {
					selector: 'button',
				} )
			).toBeInTheDocument();
			expect(
				screen.getByLabelText( 'control2', { selector: 'button' } )
			).toBeInTheDocument();
		} );

		it( 'should apply the unstyled variant correctly via the `variant` prop', () => {
			render( <Toolbar label="blocks" variant="unstyled" /> );

			expect( screen.getByRole( 'toolbar' ) ).toHaveClass(
				'is-unstyled'
			);
		} );
	} );
} );
