/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/paragraph', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/paragraph' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
