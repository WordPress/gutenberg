/**
 * Internal dependencies
 */
import { registerAudioBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/audio', () => {
	beforeAll( () => {
		registerAudioBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/audio' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
