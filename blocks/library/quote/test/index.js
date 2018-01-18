/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/quote', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/quote' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
