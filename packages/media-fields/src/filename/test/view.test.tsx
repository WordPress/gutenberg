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
		it( 'renders short filename (15 characters or less)', () => {
			const item: Partial< MediaItem > = {
				source_url: 'https://example.com/uploads/12345678901.jpg', // exactly 15 chars
			};

			render(
				<FileNameView
					item={ item as MediaItem }
					field={ filenameField as NormalizedField< MediaItem > }
				/>
			);

			// Verify the filename is visible to users
			expect( screen.getByText( '12345678901.jpg' ) ).toBeInTheDocument();
		} );

		it( 'renders long filename (more than 15 characters)', () => {
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

			// Verify the full filename text is accessible to users
			// (the component handles truncation via Truncate/Tooltip, but the text is still present)
			expect( screen.getByText( longFilename ) ).toBeInTheDocument();
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
