/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/text-columns', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/text-columns' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
