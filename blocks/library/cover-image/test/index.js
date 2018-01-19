/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

jest.mock( 'blocks/media-upload', () => () => '*** Mock(Media upload button) ***' );

describe( 'core/cover-image', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/cover-image' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
