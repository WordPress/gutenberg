/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/pullquote', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/pullquote' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
