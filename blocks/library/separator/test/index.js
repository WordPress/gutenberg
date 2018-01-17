/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/separator', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/separator' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
