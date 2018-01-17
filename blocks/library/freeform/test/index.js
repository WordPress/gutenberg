/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/freeform', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/freeform' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
