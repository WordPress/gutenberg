/**
 * Internal dependencies
 */
import { registerTableBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/embed', () => {
	beforeAll( () => {
		registerTableBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/table' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
