/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import ToolbarButton from '../../toolbar-button';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', () => {
			const { getByLabelText } = render(
				<Toolbar label="blocks">
					<ToolbarButton label="control1" />
					<ToolbarButton label="control2" />
				</Toolbar>
			);

			expect(
				getByLabelText( 'control1', { selector: 'button' } )
			).toBeTruthy();
			expect(
				getByLabelText( 'control2', { selector: 'button' } )
			).toBeTruthy();
		} );
	} );
} );
