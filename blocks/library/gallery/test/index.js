/**
 * Internal dependencies
 */
import { registerGalleryBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/gallery', () => {
	beforeAll( () => {
		registerGalleryBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/gallery' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
