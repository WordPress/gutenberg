/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/code', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/code' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
