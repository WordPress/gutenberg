import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelect } from '@wordpress/data';
import BlockVariationTransforms from '../';

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

const updateBlockAttributes = jest.fn();
const variations = [
	{
		name: 'plain',
		title: 'Plain',
		description: 'Uses the standard presentation.',
		attributes: { className: 'is-style-plain' },
	},
	{
		name: 'decorated',
		title: 'A deliberately long decorated variation title',
		description: 'Adds a decorative presentation without changing content.',
		attributes: { className: 'is-style-decorated' },
	},
];

describe( 'BlockVariationTransforms', () => {
	beforeEach( () => {
		updateBlockAttributes.mockReset();
		useDispatch.mockReturnValue( { updateBlockAttributes } );
		useSelect.mockReturnValue( {
			activeBlockVariation: variations[ 0 ],
			variations,
			canEdit: true,
			isContentOnly: false,
			isSection: false,
		} );
	} );

	it( 'selects a variation and keeps its menu open', async () => {
		const user = userEvent.setup();
		render( <BlockVariationTransforms blockClientId="client-id" /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Transform to variation' } )
		);

		const plainVariation = screen.getByRole( 'menuitemradio', {
			name: 'Plain',
		} );
		expect( plainVariation ).toBeChecked();
		expect( plainVariation ).toHaveAccessibleDescription(
			'Uses the standard presentation.'
		);

		const decoratedVariation = screen.getByRole( 'menuitemradio', {
			name: 'A deliberately long decorated variation title',
		} );
		expect( decoratedVariation ).toHaveAccessibleDescription(
			'Adds a decorative presentation without changing content.'
		);
		await user.click( decoratedVariation );

		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'client-id', {
			className: 'is-style-decorated',
		} );
		expect( decoratedVariation ).toBeVisible();
	} );
} );
