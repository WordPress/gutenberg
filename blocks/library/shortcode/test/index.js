/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/shortcode', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/shortcode' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
