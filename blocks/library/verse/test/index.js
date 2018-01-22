/**
 * Internal dependencies
 */
import '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/verse', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/verse' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
