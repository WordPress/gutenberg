/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/button', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/button' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
