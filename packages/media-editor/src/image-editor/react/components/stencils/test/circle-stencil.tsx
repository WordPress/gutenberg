/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { CircleStencil } from '../circle-stencil';
import type { NormalizedRect, Size } from '../../../../core/types';

const CROP_RECT: NormalizedRect = {
	x: 0.1,
	y: 0.1,
	width: 0.8,
	height: 0.8,
};
const CONTAINER_SIZE: Size = { width: 600, height: 400 };
const IMAGE_SIZE: Size = { width: 500, height: 300 };

describe( 'CircleStencil', () => {
	it( 'renders a circular stencil using edge resize handles', () => {
		render(
			<CircleStencil
				cropRect={ CROP_RECT }
				containerSize={ CONTAINER_SIZE }
				imageSize={ IMAGE_SIZE }
				onCropChange={ jest.fn() }
				freeformCrop
			/>
		);

		expect( screen.getByTestId( 'cropper-stencil' ) ).toHaveClass(
			'wp-media-editor-image-editor__stencil--circle'
		);
		expect(
			screen.getByRole( 'button', { name: 'Resize from top edge' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Resize from right edge' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Resize from bottom edge' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Resize from left edge' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', {
				name: 'Resize from top-left corner',
			} )
		).not.toBeInTheDocument();
	} );
} );
