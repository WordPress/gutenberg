/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Need to mock the BlockControls wrapper as this requires a slot to run
// so can't be easily unit tested.
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	BlockControls: ( { children } ) => <div>{ children }</div>,
} ) );

/**
 * Internal dependencies
 */
import CoverBlockControls from '../edit/block-controls';

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
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );
			render( <CoverBlockControls { ...defaultProps } /> );
			await user.click( screen.getByLabelText( 'Toggle full height' ) );
			expect( setAttributes ).toHaveBeenCalledWith( {
				minHeight: 100,
				minHeightUnit: 'vh',
			} );
		} );
	} );
} );
