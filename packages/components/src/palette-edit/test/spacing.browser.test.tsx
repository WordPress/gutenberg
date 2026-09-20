import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
// Load the same tokens and button styles used by consumers.
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../../../theme/prebuilt/css/design-tokens.css';
// eslint-disable-next-line @wordpress/no-non-module-stylesheet-imports
import '../../button/style.scss';
import PaletteEdit from '..';

const colors = [ { color: '#ffffff', name: 'White', slug: 'white' } ];
const defaultProps = { paletteLabel: 'Custom', onChange: () => {} };

describe( 'PaletteEdit action spacing', () => {
	it.each( [ 'ltr', 'rtl' ] )(
		'keeps adjacent palette action buttons separated in %s layouts',
		async ( dir ) => {
			await render(
				<div dir={ dir } style={ { width: 320 } }>
					<PaletteEdit { ...defaultProps } colors={ colors } />
				</div>
			);

			const addButton = screen.getByRole( 'button', {
				name: 'Add color',
			} );
			const optionsButton = screen.getByRole( 'button', {
				name: 'Color options',
			} );
			const addBounds = addButton.getBoundingClientRect();
			const optionsBounds = optionsButton.getBoundingClientRect();
			expect(
				Math.max( addBounds.left, optionsBounds.left ) -
					Math.min( addBounds.right, optionsBounds.right )
			).toBeGreaterThanOrEqual( 4 );

			await userEvent.click( optionsButton );
			await userEvent.click(
				screen.getByRole( 'menuitem', { name: 'Show details' } )
			);

			const doneBounds = screen
				.getByRole( 'button', { name: 'Done' } )
				.getBoundingClientRect();
			const editingAddBounds = addButton.getBoundingClientRect();
			const editingOptionsBounds = optionsButton.getBoundingClientRect();
			expect(
				Math.max( doneBounds.left, editingAddBounds.left ) -
					Math.min( doneBounds.right, editingAddBounds.right )
			).toBeGreaterThanOrEqual( 4 );
			expect(
				Math.max( editingAddBounds.left, editingOptionsBounds.left ) -
					Math.min(
						editingAddBounds.right,
						editingOptionsBounds.right
					)
			).toBeGreaterThanOrEqual( 4 );
		}
	);
} );
