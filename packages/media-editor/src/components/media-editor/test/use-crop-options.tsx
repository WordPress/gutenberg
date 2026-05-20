/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useCropOptions } from '../use-crop-options';
import type { Media } from '../../media-editor-provider';
import { ORIGINAL_ASPECT_RATIO } from '../../../image-editor/core/constants';
import { CropperProvider, useCropper } from '../../../image-editor';

const media = {
	id: 1,
	media_details: {
		width: 1200,
		height: 600,
	},
} as Media;

function CropOptionsInner( {
	id = 1,
	isImage = true,
}: {
	id?: number;
	isImage?: boolean;
} ) {
	const cropper = useCropper();
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
			<div data-testid="has-undo">
				{ cropper.hasUndo ? 'true' : 'false' }
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
			<button onClick={ () => cropOptions.setFreeformCrop( true ) }>
				Enable handles
			</button>
			<button onClick={ cropOptions.resetCropOptions }>Reset</button>
			<button onClick={ cropper.undo }>Undo</button>
			<button onClick={ cropper.redo }>Redo</button>
		</div>
	);
}

function CropOptionsHarness( props: { id?: number; isImage?: boolean } ) {
	return (
		<CropperProvider>
			<CropOptionsInner { ...props } />
		</CropperProvider>
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

	describe( 'undo/redo via history satellite', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );
		afterEach( () => {
			jest.useRealTimers();
		} );

		const advanceDebounce = () => {
			act( () => {
				jest.advanceTimersByTime( 300 );
			} );
		};

		it( 'records an aspect-ratio change so undo reverts the sidebar', () => {
			render( <CropOptionsHarness /> );

			fireEvent.click( screen.getByRole( 'button', { name: 'Square' } ) );
			advanceDebounce();

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '1' );
			expect( screen.getByTestId( 'has-undo' ) ).toHaveTextContent(
				'true'
			);

			fireEvent.click( screen.getByRole( 'button', { name: 'Undo' } ) );

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '0' );
		} );

		it( 'records a Resize-crop toggle even when the crop rect does not move', () => {
			render( <CropOptionsHarness /> );

			fireEvent.click(
				screen.getByRole( 'button', { name: 'Disable handles' } )
			);
			advanceDebounce();

			expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
				'false'
			);
			expect( screen.getByTestId( 'has-undo' ) ).toHaveTextContent(
				'true'
			);

			fireEvent.click( screen.getByRole( 'button', { name: 'Undo' } ) );

			expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
				'true'
			);
		} );

		it( 'redoes a satellite change after undo', () => {
			render( <CropOptionsHarness /> );

			fireEvent.click( screen.getByRole( 'button', { name: 'Square' } ) );
			advanceDebounce();
			fireEvent.click( screen.getByRole( 'button', { name: 'Undo' } ) );

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '0' );

			fireEvent.click( screen.getByRole( 'button', { name: 'Redo' } ) );

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '1' );
		} );

		it( 'restores both aspect ratio and freeform together (Free auto-enables freeform)', () => {
			render( <CropOptionsHarness /> );

			// Establish a non-default starting point: Square + handles off.
			fireEvent.click( screen.getByRole( 'button', { name: 'Square' } ) );
			advanceDebounce();
			fireEvent.click(
				screen.getByRole( 'button', { name: 'Disable handles' } )
			);
			advanceDebounce();

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '1' );
			expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
				'false'
			);

			// Picking Free flips freeform back on via the setter side-effect.
			fireEvent.click( screen.getByRole( 'button', { name: 'Free' } ) );
			advanceDebounce();

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '0' );
			expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
				'true'
			);

			// Undo should restore the (Square, handles-off) pair — proving the
			// satellite captures both fields atomically and the auto-enable
			// side-effect doesn't leak into the restored state.
			fireEvent.click( screen.getByRole( 'button', { name: 'Undo' } ) );

			expect(
				screen.getByTestId( 'aspect-ratio-value' )
			).toHaveTextContent( '1' );
			expect( screen.getByTestId( 'freeform-crop' ) ).toHaveTextContent(
				'false'
			);
		} );
	} );
} );
