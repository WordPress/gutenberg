/**
 * Internal dependencies
 */
import { setBackgroundStyleDefaults } from '../background';
import { ROOT_BLOCK_SELECTOR } from '../../components/global-styles/utils';

describe( 'background', () => {
	describe( 'setBackgroundStyleDefaults', () => {
		it( 'should return the block styles if the block styles do not have a background', () => {
			const blockStyles = { color: 'red' };
			expect( setBackgroundStyleDefaults( blockStyles ) ).toEqual(
				blockStyles
			);
		} );

		it( 'should return the block styles if `background` is not an object', () => {
			const blockStyles = { background: 'red' };
			expect( setBackgroundStyleDefaults( blockStyles ) ).toEqual(
				blockStyles
			);
		} );

		it( 'should return the background size defaults', () => {
			const blockStyles = {
				background: { backgroundImage: 'some-image.jpg' },
			};
			expect( setBackgroundStyleDefaults( blockStyles ) ).toEqual( {
				background: {
					backgroundImage: 'some-image.jpg',
					backgroundSize: 'cover',
				},
			} );
		} );

		it( 'should return an absolute theme URL path', () => {
			const blockStyles = {
				background: {
					backgroundImage: {
						source: 'theme',
						url: '/some-image.jpg',
					},
				},
			};
			const options = { themeDirURI: 'http://example.com' };
			expect(
				setBackgroundStyleDefaults( blockStyles, options )
			).toEqual( {
				background: {
					backgroundImage: {
						source: 'theme',
						url: 'http://example.com/some-image.jpg',
					},
					backgroundSize: 'cover',
				},
			} );
		} );

		it( 'should not add background size defaults for root selector', () => {
			const blockStyles = {
				background: {
					backgroundImage: {
						source: 'theme',
						url: '/some-image.jpg',
					},
				},
			};
			const options = {
				themeDirURI: 'http://example.com',
				selector: ROOT_BLOCK_SELECTOR,
			};
			expect(
				setBackgroundStyleDefaults( blockStyles, options )
			).toEqual( {
				background: {
					backgroundImage: {
						source: 'theme',
						url: 'http://example.com/some-image.jpg',
					},
				},
			} );
		} );
	} );
} );
