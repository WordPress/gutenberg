/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/more', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/more' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
