/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/html', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/html' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
