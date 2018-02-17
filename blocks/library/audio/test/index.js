/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/audio', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
