/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useCropOptions } from '../use-crop-options';
import { ORIGINAL_ASPECT_RATIO } from '../../../image-editor/core/constants';
import { MediaEditorStateProvider } from '../../../state';

function CropOptionsHarness() {
	const cropOptions = useCropOptions( {
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
			<button onClick={ cropOptions.resetCropOptions }>Reset</button>
		</div>
	);
}

function renderHarness() {
	render(
		<MediaEditorStateProvider
			initialCropperState={ {
				image: {
					src: 'test.jpg',
					naturalWidth: 1200,
					naturalHeight: 600,
				},
			} }
		>
			<CropOptionsHarness />
		</MediaEditorStateProvider>
	);
}

describe( 'useCropOptions', () => {
	it( 'builds explicit aspect-ratio options', () => {
		renderHarness();

		expect(
			screen.getByTestId( 'aspect-ratio-options' )
		).toHaveTextContent( '0,-1,1,1.3333333333333333' );
	} );

	it( 'resolves the Original aspect ratio from the cropper image dimensions', () => {
		renderHarness();

		fireEvent.click( screen.getByRole( 'button', { name: 'Original' } ) );

		// 1200 / 600 = 2.
		expect(
			screen.getByTestId( 'resolved-aspect-ratio' )
		).toHaveTextContent( '2' );
	} );

	it( 'reports Free as undefined resolved aspect ratio', () => {
		renderHarness();

		fireEvent.click( screen.getByRole( 'button', { name: 'Free' } ) );

		expect(
			screen.getByTestId( 'resolved-aspect-ratio' )
		).toHaveTextContent( 'undefined' );
	} );

	it( 'reset returns cropOptions to defaults', () => {
		renderHarness();

		fireEvent.click( screen.getByRole( 'button', { name: 'Square' } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'Reset' } ) );

		expect( screen.getByTestId( 'aspect-ratio-value' ) ).toHaveTextContent(
			'0'
		);
	} );
} );
