/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/preformatted', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/preformatted' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
