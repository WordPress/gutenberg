/**
 * Internal dependencies
 */
import { registerCoverImageBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/cover-image', () => {
	beforeAll( () => {
		registerCoverImageBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/cover-image' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
