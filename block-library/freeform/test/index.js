/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../../packages/block-library/src/test/helpers';

describe( 'core/freeform', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
