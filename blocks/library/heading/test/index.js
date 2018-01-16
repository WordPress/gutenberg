/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/heading', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/heading' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
