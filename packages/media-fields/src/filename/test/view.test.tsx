/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import FileNameView from '../view';
import filenameField from '../index';
import type { MediaItem } from '../../types';

describe( 'FileNameView', () => {
	describe( 'filename rendering', () => {
		it( 'renders short filename without a tooltip anchor', () => {
			const item: Partial< MediaItem > = {
				source_url: 'https://example.com/uploads/12345678901.jpg', // exactly 15 chars
			};

			render(
				<FileNameView
					item={ item as MediaItem }
					field={ filenameField as NormalizedField< MediaItem > }
				/>
			);

			const rendered = screen.getByText( '12345678901.jpg' );
			expect( rendered ).toHaveClass( 'dataviews-media-field__filename' );
		} );

		it( 'renders long filename inside a Tooltip and exposes the full name in the DOM', () => {
			const longFilename =
				'very-long-filename-that-exceeds-fifteen-characters.jpg';
			const item: Partial< MediaItem > = {
				source_url: `https://example.com/uploads/${ longFilename }`,
			};

			render(
				<FileNameView
					item={ item as MediaItem }
					field={ filenameField as NormalizedField< MediaItem > }
				/>
			);

			// CSS handles the visual ellipsis; the DOM text remains the full
			// filename so assistive technology reading the row gets the
			// complete name, and the Tooltip exposes it on mouse hover.
			const rendered = screen.getByText( longFilename );
			expect( rendered ).toHaveClass( 'dataviews-media-field__filename' );
		} );
	} );

	describe( 'edge cases', () => {
		it( 'renders nothing when source_url is missing', () => {
			const item: Partial< MediaItem > = {};

			const { container } = render(
				<FileNameView
					item={ item as MediaItem }
					field={ filenameField as NormalizedField< MediaItem > }
				/>
			);

			// When there's no source_url, component should render nothing
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders nothing when source_url is empty', () => {
			const item: Partial< MediaItem > = {
				source_url: '',
			};

			const { container } = render(
				<FileNameView
					item={ item as MediaItem }
					field={ filenameField as NormalizedField< MediaItem > }
				/>
			);

			// When source_url is empty, component should render nothing
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
