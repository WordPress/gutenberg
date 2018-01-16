/**
 * Internal dependencies
 */
import { registerPreformattedBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/preformatted', () => {
	beforeAll( () => {
		registerPreformattedBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/preformatted' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
