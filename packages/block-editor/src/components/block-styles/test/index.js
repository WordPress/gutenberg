import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlockStyles from '../';

const mockOnSelect = jest.fn();

const STYLES = [
	{ name: 'default', label: 'Default', isDefault: true },
	{ name: 'fancy', label: 'A very long fancy style label' },
];

jest.mock( '../use-styles-for-block', () => ( {
	__esModule: true,
	default: () => ( {
		onSelect: mockOnSelect,
		stylesToRender: STYLES,
		activeStyle: STYLES[ 0 ],
		genericPreviewBlock: null,
		className: '',
	} ),
} ) );

describe( 'BlockStyles', () => {
	beforeEach( () => {
		mockOnSelect.mockClear();
	} );

	it( 'renders the active style and offers every style in full', async () => {
		const user = userEvent.setup();
		render( <BlockStyles clientId="1" /> );

		const select = screen.getByRole( 'combobox', { name: 'Variation' } );
		expect( select ).toHaveTextContent( 'Default' );

		await user.click( select );

		// Labels are rendered in full, rather than truncated.
		expect(
			await screen.findByRole( 'option', {
				name: 'A very long fancy style label',
			} )
		).toBeVisible();
	} );

	it( 'selects the style picked from the popup', async () => {
		const user = userEvent.setup();
		render( <BlockStyles clientId="1" /> );

		await user.click(
			screen.getByRole( 'combobox', { name: 'Variation' } )
		);
		await user.click(
			await screen.findByRole( 'option', {
				name: 'A very long fancy style label',
			} )
		);

		expect( mockOnSelect ).toHaveBeenCalledWith( STYLES[ 1 ] );
	} );
} );
