/**
 * Internal dependencies
 */
import { registerVideoBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/video', () => {
	beforeAll( () => {
		registerVideoBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/video' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
