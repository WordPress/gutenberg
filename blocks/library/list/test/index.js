/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/list', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/list' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
