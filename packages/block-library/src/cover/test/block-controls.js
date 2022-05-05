/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { CoverBlockControlsPrimary } from '../block-controls';

const setAttributes = jest.fn();
const setOverlayColor = jest.fn();
const onSelectMedia = jest.fn();

const defaultProps = {
	setAttributes,
	setOverlayColor,
	onSelectMedia,
	hasInnerBlocks: true,
	minHeight: 300,
	minHeightUnit: 'px',
};

beforeEach( () => {
	setAttributes.mockClear();
	setOverlayColor.mockClear();
	onSelectMedia.mockClear();
} );

describe( 'Cover block controls', () => {
	describe( 'Full height toggle', () => {
		test( 'displays toggle full height button toggled off if minHeight not 100vh', () => {
			render( <CoverBlockControlsPrimary { ...defaultProps } /> );
			expect(
				screen.getByRole( 'button', {
					pressed: false,
					name: 'Toggle full height',
				} )
			).toBeInTheDocument();
		} );
		test( 'sets minHeight attributes to 100vh when clicked', () => {
			render( <CoverBlockControlsPrimary { ...defaultProps } /> );
			fireEvent.click( screen.getByLabelText( 'Toggle full height' ) );
			expect( setAttributes ).toHaveBeenCalledWith( {
				minHeight: 100,
				minHeightUnit: 'vh',
			} );
		} );
	} );
} );
