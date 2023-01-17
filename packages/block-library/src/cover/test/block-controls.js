/**
 * External dependencies
 */
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Need to mock the BlockControls wrapper as this requires a slot to run
// so can't be easily unit tested.
jest.mock(
	'@wordpress/block-editor/src/components/block-controls',
	() =>
		( { children } ) =>
			<div className="block-control">{ children }</div>
);

/**
 * Internal dependencies
 */
import CoverBlockControls from '../edit/block-controls';

function setup( jsx ) {
	return {
		user: userEvent.setup(),
		...render( jsx ),
	};
}

const setAttributes = jest.fn();
const onSelectMedia = jest.fn();

const currentSettings = { hasInnerBlocks: true, url: undefined };
const defaultAttributes = {
	contentPosition: undefined,
	id: 1,
	useFeaturedImage: false,
	dimRatio: 50,
	minHeight: 300,
	minHeightUnit: 'px',
};
const defaultProps = {
	attributes: defaultAttributes,
	currentSettings,
	setAttributes,
	onSelectMedia,
};

beforeEach( () => {
	setAttributes.mockClear();
	onSelectMedia.mockClear();
} );

describe( 'Cover block controls', () => {
	describe( 'Full height toggle', () => {
		test( 'displays toggle full height button toggled off if minHeight not 100vh', () => {
			render( <CoverBlockControls { ...defaultProps } /> );
			expect(
				screen.getByRole( 'button', {
					pressed: false,
					name: 'Toggle full height',
				} )
			).toBeInTheDocument();
		} );
		test( 'sets minHeight attributes to 100vh when clicked', async () => {
			const { user } = setup(
				<CoverBlockControls { ...defaultProps } />
			);
			await user.click( screen.getByLabelText( 'Toggle full height' ) );
			expect( setAttributes ).toHaveBeenCalledWith( {
				minHeight: 100,
				minHeightUnit: 'vh',
			} );
		} );
	} );
	describe( 'Content position', () => {
		test( 'displays content position button', () => {
			render( <CoverBlockControls { ...defaultProps } /> );
			expect(
				screen.getByRole( 'button', {
					name: 'Change content position',
				} )
			).toBeInTheDocument();
		} );
		test( 'sets contentPosition attribute', async () => {
			const { user } = setup(
				<CoverBlockControls { ...defaultProps } />
			);

			await user.click(
				screen.getByLabelText( 'Change content position' )
			);

			await act( async () =>
				within( screen.getByRole( 'grid' ) )
					.getByRole( 'gridcell', {
						name: 'top left',
					} )
					.focus()
			);

			expect( setAttributes ).toHaveBeenCalledWith( {
				contentPosition: 'top left',
			} );
		} );
	} );
	describe( 'Duotone filter', () => {
		test( 'displays the add media button', () => {
			render( <CoverBlockControls { ...defaultProps } /> );
			expect(
				screen.getByRole( 'button', {
					name: 'Add Media',
				} )
			).toBeInTheDocument();
		} );
	} );
} );
