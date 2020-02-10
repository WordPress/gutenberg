/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { ImageEdit } from '../edit';

describe( 'core/image/edit', () => {
	describe( 'onSelectImage', () => {
		test( 'should reset dimensions when changing the image and keep them on selecting the same image', () => {
			const attributes = {
				id: 1,
				url: 'http://www.example.com/myimage.jpeg',
				alt: 'alt1',
			};
			const setAttributes = jest.fn( () => {} );
			const testRenderer = TestRenderer.create(
				<ImageEdit
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			);
			const instance = testRenderer.getInstance();

			instance.onSelectImage( {
				id: 1,
				url: 'http://www.example.com/myimage.jpeg',
				alt: 'alt2',
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 1,
				url: 'http://www.example.com/myimage.jpeg',
				alt: 'alt2',
			} );
			instance.onSelectImage( {
				id: 2,
				url: 'http://www.example.com/myimage.jpeg',
				alt: 'alt2',
			} );
			expect( setAttributes ).toHaveBeenCalledWith( {
				id: 2,
				url: 'http://www.example.com/myimage.jpeg',
				alt: 'alt2',
				sizeSlug: 'large',
				width: undefined,
				height: undefined,
			} );
		} );
	} );
} );
