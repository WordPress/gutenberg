/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../test/helpers';

describe( 'core/image', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
