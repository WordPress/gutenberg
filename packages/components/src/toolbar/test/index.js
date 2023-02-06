/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Toolbar, ToolbarButton } from '..';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', () => {
			render(
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
	} );
} );
