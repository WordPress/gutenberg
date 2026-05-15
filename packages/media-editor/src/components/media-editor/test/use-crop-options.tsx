/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useCropOptions } from '../use-crop-options';
import type { Media } from '../../media-editor-provider';
import { ORIGINAL_ASPECT_RATIO } from '../../../image-editor/core/constants';

const media = {
	id: 1,
	media_details: {
		width: 1200,
		height: 600,
	},
} as Media;

function CropOptionsHarness( {
	id = 1,
	isImage = true,
}: {
	id?: number;
	isImage?: boolean;
} ) {
	const cropOptions = useCropOptions( {
		id,
		isImage,
		media,
		aspectRatioPresets: [
			{ label: 'Square', value: 1 },
			{ label: 'Landscape', value: 4 / 3 },
		],
	} );

	return (
		<div>
			<div data-testid="aspect-ratio-value">
				{ cropOptions.aspectRatioValue }
			</div>
			<div data-testid="freeform-crop">
				{ cropOptions.freeformCrop ? 'true' : 'false' }
			</div>
			<div data-testid="resolved-aspect-ratio">
				{ cropOptions.resolvedAspectRatio ?? 'undefined' }
			</div>
			<div data-testid="aspect-ratio-options">
				{ cropOptions.aspectRatioOptions
					.map( ( option ) => option.value )
					.join( ',' ) }
			</div>
			<button
				onClick={ () =>
					cropOptions.setAspectRatioValue(
						ORIGINAL_ASPECT_RATIO.toString()
					)
				}
			>
				Original
			</button>
			<button onClick={ () => cropOptions.setAspectRatioValue( '1' ) }>
				Square
			</button>
			<button onClick={ () => cropOptions.setAspectRatioValue( '0' ) }>
				Free
			</button>
			<button onClick={ () => cropOptions.setFreeformCrop( false ) }>
				Disable handles
			</button>
			<button onClick={ cropOptions.resetCropOptions }>Reset</button>
		</div>
	);
}

describe( 'useCropOptions', () => {
	it( 'builds explicit aspect-ratio options', () => {
		render( <CropOptionsHarness /> );

		expect(
			screen.getByTestId( 'aspect-ratio-options' )
		).toHaveTextContent( '0,-1,1,1.3333333333333333' );
	} );

	it( 'resolves the Original aspect ratio from image dimensions', () => {
		render( <CropOptionsHarness /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Original' } ) );

		expect(
			screen.getByTestId( 'resolved-aspect-ratio' )
		).toHaveTextContent( '2' );
	} );

	it( 'enables freeform crop when Free is selected', () => {
		render( <CropOptionsHarness /> );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Disable handles' } )
		);
		fireEvent.click( screen.getByRole( 'button', { name: 'Free' } ) );

		expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
			'true'
		);
	} );

	it( 'resets crop options when the media id changes', () => {
		const { rerender } = render( <CropOptionsHarness id={ 1 } /> );

		fireEvent.click( screen.getByRole( 'button', { name: 'Square' } ) );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Disable handles' } )
		);

		rerender( <CropOptionsHarness id={ 2 } /> );

		expect( screen.getByTestId( 'aspect-ratio-value' ) ).toHaveTextContent(
			'0'
		);
		expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
			'true'
		);
	} );
} );
